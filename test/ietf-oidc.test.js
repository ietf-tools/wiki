const { expect } = require('chai');
const { join } = require('path');
const { readFileSync } = require('fs');
const _ = require('lodash');

const { __testing: authModule } = require('../ietf/authentication.js');

/* Mock Wiki.js logger function */
const mockLogger = {
  error: _ => { },
  warn: _ => { },
  info: _ => { },
  verbose: _ => { },
  debug: _ => { },
};
/* Mock Wiki.js database query (hard code a convention to get gids from group name) */
const mockWhere = (_where, _equals, name) => name.split('_gid').filter((_, idx) => idx > 0).map(val => { return { id: parseInt(val), name }; });
/* Mock global WIKI object */
global.WIKI = {
  logger: mockLogger,
  models: {
    groups: {
      query: _ => {
        return {
          where: mockWhere
        };
      }
    }
  }
};

describe('JSON importing Test', () => {
  const path = join(__dirname, 'files/mappings.json');
  const jsonObj = JSON.parse(readFileSync(path));
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
  const importedJson = authModule.importJsonMappings({ context, path, force: true });

  it('imported JSON object should match input file', () => {
    expect(_.isEqual(importedJson, jsonObj)).to.be.true;
  });
  it('context should contain defaults', () => {
    expect(_.isEqual(context.groupMappings.defaults, jsonObj.defaults)).to.be.true;
  });
  it('context should contain roles mappings', () => {
    expect(_.isEqual(context.groupMappings.mappings.roles, jsonObj.mappings.roles)).to.be.true;
  });
  it('context should contain dots mappings', () => {
    expect(_.isEqual(context.groupMappings.mappings.dots, jsonObj.mappings.dots)).to.be.true;
  });
  it('context last-modified should be greater than 0', () => {
    expect(context.lastModified).to.be.above(0);
  });
});

describe('User role matching Test', () => {
  const path = join(__dirname, 'files/mappings.json');
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
  authModule.importJsonMappings({ context, path, force: true });
  const noRolesProfile = JSON.parse(readFileSync(join(__dirname, 'files/profile-no-roles.json')));
  const ietfChairProfile = JSON.parse(readFileSync(join(__dirname, 'files/profile-ietf-chair.json')));
  const genericProfile = JSON.parse(readFileSync(join(__dirname, 'files/profile-generic.json')));

  it('User without roles and dots should have only default groups', async () => {
    const matchedGroups = await authModule.matchUserRoles({ context, profile: noRolesProfile, rolesClaim: 'roles', dotsClaim: 'dots' });
    expect(_.isEqual(matchedGroups, [1, 2])).to.be.true;
  });
  it('User with roles matching the wildcards', async () => {
    const matchedGroups = await authModule.matchUserRoles({ context, profile: ietfChairProfile, rolesClaim: 'roles', dotsClaim: 'dots' });
    expect(_.isEqual(matchedGroups, [1, 2, 3, 4, 5, 6])).to.be.true;
  });
  it('User with roles and dots matching generic rules', async () => {
    const matchedGroups = await authModule.matchUserRoles({ context, profile: genericProfile, rolesClaim: 'roles', dotsClaim: 'dots' });
    expect(_.isEqual(matchedGroups, [1, 2, 3, 99, 1099])).to.be.true;
  });
});