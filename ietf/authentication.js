const _ = require('lodash');
const { readFileSync, statSync } = require('fs');
const { join } = require('path');

/* global WIKI */

const OpenIDConnectStrategy = require('passport-openidconnect').Strategy;

const context = {
  groupMappings: {
    defaults: [],
    mappings: {
      roles: {},
      dots: {},
    },
  },
  lastModified: -1,
};

const mappingsFilePath = join(__dirname, 'mappings.json');

module.exports = {
  init(passport, conf) {
    WIKI.logger.debug(`[ietf-auth] current conf -> ${JSON.stringify(conf)}`);
    const { authorizationURL, callbackURL, clientId: clientID, clientSecret, emailClaim, issuer, rolesClaim, dotsClaim, scope, tokenURL, userInfoURL } = conf;
    importJsonMappings({ context, path: mappingsFilePath, force: true });
    WIKI.logger.debug(`[ietf-auth] current mappings -> ${JSON.stringify(context.groupMappings)}`);
    passport.use(
      'ietf',
      new OpenIDConnectStrategy({
        authorizationURL,
        callbackURL,
        clientID,
        clientSecret,
        issuer,
        passReqToCallback: true,
        scope,
        tokenURL,
        userInfoURL,
      }, async (req, _iss, _sub, profile, cb) => {
        try {
          const user = await WIKI.models.users.processProfile({
            providerKey: req.params.strategy,
            profile: {
              ...profile,
              email: _.get(profile, '_json.' + emailClaim)
            }
          });
          WIKI.logger.debug(`[ietf-auth] user profile -> ${JSON.stringify(profile)}`);
          importJsonMappings({ context, path: mappingsFilePath, force: false });
          const ietfUserGroups = await matchUserRoles({ context, profile, rolesClaim, dotsClaim });
          await WIKI.models.users.updateUser({
            id: user.id,
            groups: ietfUserGroups,
          });
          cb(null, user);
        } catch (err) {
          cb(err, null);
        }
      })
    );
  },
  logout({ logoutURL }) {
    if (!logoutURL) {
      return '/';
    } else {
      return logoutURL;
    }
  },
  __testing: {
    importJsonMappings,
    matchUserRoles
  }
};

/* Helper function to read the last modified timestamp of mappings.json */
function getLastModified({ path }) {
  try {
    const { mtimeMs } = statSync(path);
    return mtimeMs;
  } catch ({ message }) {
    WIKI.logger.error(`[ietf-auth] error getting the mappings file last modified time (${message})`);
    return -1;
  }
}

/* Import mapping rules from a file */
/* If set, force parameter will not control the last-modified time of the file before importing */
function importJsonMappings({ context, path, force = true }) {
  const lms = getLastModified({ path });
  let newMappings;
  if (!force) {
    if (lms <= context.lastModified) return;
    WIKI.logger.info('[ietf-auth] mappings json has been modified since the last time!');
  }
  try {
    newMappings = JSON.parse(readFileSync(path));
  } catch ({ message }) {
    WIKI.logger.error(`[ietf-auth] error importing mappings json (${message})`);
    return;
  }
  context.groupMappings = newMappings;
  context.lastModified = lms;
  WIKI.logger.info('[ietf-auth] mappings json imported successfully');
  return newMappings;
}

/* Return an array of wiki groups matching the given name */
async function getGroupsByName(name) {
  const wikiGroups = await WIKI.models.groups.query().where('name', '=', name);
  return wikiGroups;
}

/* Return an array of Wiki.js group IDs, by mapping the datatracker */
/* roles to the Wiki.js groups, according to the mappings JSON */
async function matchUserRoles({ context, profile, rolesClaim, dotsClaim }) {
  const userRoles = _.get(profile, '_json.' + rolesClaim);
  WIKI.logger.debug(`[ietf-auth] user roles -> ${JSON.stringify(userRoles)}`);
  if (!Array.isArray(userRoles)) throw new Error(`user profile is missing "${rolesClaim}" scope`);

  const userDots = _.get(profile, '_json.' + dotsClaim);
  WIKI.logger.debug(`[ietf-auth] user dots -> ${JSON.stringify(userDots)}`);
  if (!Array.isArray(userDots)) throw new Error(`user profile is missing "${dotsClaim}" scope`);

  /* Use Set to avoid duplicates */
  const userWikiGroupIds = new Set();
  const userWikiGroupNames = new Set();


  /* Add defaults groups */
  for (const wikiGroupName of context.groupMappings.defaults) {
    /* Do not add duplicate group names */
    if (userWikiGroupNames.has(wikiGroupName)) continue;
    userWikiGroupNames.add(wikiGroupName);
    /* Add the user to all group ids matching the name wikiGroupName */
    for (const { id: groupId } of await getGroupsByName(wikiGroupName)) {
      WIKI.logger.info(`[ietf-auth] adding user "${profile.displayName}" to default group "${wikiGroupName}" (id=${groupId})`);
      userWikiGroupIds.add(groupId);
    }
  }

  /* Check group mappings */
  for (const [wikiGroupName, tuplesMap] of Object.entries(context.groupMappings.mappings.roles)) {
    WIKI.logger.verbose(`[ietf-auth] checking if user roles match the wiki group "${wikiGroupName}"`);
    /* Do not add duplicate group names */
    if (userWikiGroupNames.has(wikiGroupName)) continue;
    /* Check for any matching rule [ role, group, ... ] -->  wikiGroupName */
    for (const tupleMap of tuplesMap) {
      for (const userRole of userRoles) {
        if (!_.isEqualWith(tupleMap, userRole, (tupleValue, usrValue) => { if ([usrValue, '*'].includes(tupleValue)) return true; })) continue;
        WIKI.logger.verbose(`[ietf-auth] user "${profile.displayName}" matched roles rule "${JSON.stringify(tupleMap)}" --> "${wikiGroupName}"`);
        userWikiGroupNames.add(wikiGroupName);
        /* Add the user to all group ids matching the name wikiGroupName */
        for (const { id: groupId } of await getGroupsByName(wikiGroupName)) {
          WIKI.logger.info(`[ietf-auth] adding user "${profile.displayName}" to group "${wikiGroupName}" (id=${groupId})`);
          userWikiGroupIds.add(groupId);
        }
        break;
      }
      /* In case of matched rule break the loop */
      if (userWikiGroupNames.has(wikiGroupName)) break;
    }
  }

  for (const [wikiGroupName, dots] of Object.entries(context.groupMappings.mappings.dots)) {
    WIKI.logger.verbose(`[ietf-auth] checking if user dots match the wiki group "${wikiGroupName}"`);
    /* Do not add duplicate group names */
    if (userWikiGroupNames.has(wikiGroupName)) continue;
    /* Check for any matching rule [ dot, ... ] -->  wikiGroupName */
    for (const userDot of userDots) {
      if (!dots.includes(userDot)) continue;
      WIKI.logger.verbose(`[ietf-auth] user "${profile.displayName}" matched dots rule "${JSON.stringify(dots)}" --> "${wikiGroupName}"`);
      userWikiGroupNames.add(wikiGroupName);
      /* Add the user to all group ids matching the name wikiGroupName */
      for (const { id: groupId } of await getGroupsByName(wikiGroupName)) {
        WIKI.logger.info(`[ietf-auth] adding user "${profile.displayName}" to group "${wikiGroupName}" (id=${groupId})`);
        userWikiGroupIds.add(groupId);
      }
      break;
    }
  }

  return [...userWikiGroupIds];
}