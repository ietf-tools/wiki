<div align="center">
    
<img src="https://raw.githubusercontent.com/ietf-tools/common/main/assets/logos/ietf-wikijs-auth.svg" alt="IETF Wiki.js Auth" height="125" />
    
[![License](https://img.shields.io/github/license/ietf-tools/ietf-wikijs-auth)](https://github.com/ietf-tools/ietf-wikijs-auth/blob/main/LICENSE)

##### IETF Authentication Module for Wiki.js
    
</div>

---

This repository contains the code of a Wiki.js authentication module that lets the IETF users login through the Datatracker OpenID Connect.

# Setup (Docker)
1. `docker-compose up`
2. complete the initial setup of wiki.js by connecting to `http://HOST:PORT` (default `PORT` is 1926)
3. create a homepage
4. head to wiki.js **Administration** settings and add the groups specified in `mappings.json`
5. create the group rules if you need to enforce the permission system
6. in **Authentication** settings add the strategy **IETF datatracker OpenID Connect**
    * enable *Allow self-registration*
    * complete the configuration with the IETF provider settings
    * ensure that the machine is reachable to the strategy *callback URL*

# Setup (existing wiki.js instance)
1. copy the whole `ietf` folder under the path `server/modules/authentication/` of your wiki.js
2. head to wiki.js **Administration** settings and add the groups specified in `mappings.json`
3. create the group rules if you need to enforce the permission system
4. in **Authentication** settings add the strategy **IETF datatracker OpenID Connect**
    * enable *Allow self-registration*
    * complete the configuration with the IETF provider settings
    * ensure that the machine is reachable to the strategy *callback URL*

# Mapping datatracker roles to wiki.js groups
The mapping between IETF datatracker roles and wiki.js groups can be specified in the `mappings.json` file.
The format of the file is the following: 
```
{
    "defaults": Array of Strings,
    "groups": Array of Strings,
    "mappings": Object
}
```
`defaults` contains the list of the groups that will be auto-added to any authenticated users, e.g.:

```
{
    "defaults": ["members", "users"],
    "groups": [],
    "mappings": {
        ...
    }
}
```

`groups` contains the list of the groups that will be automatically created if they don't already exist on initialization:

```
{
    "defaults": [],
    "groups": ["iesg", "ietf-chairs"],
    "mappings": {
        ...
    }
}
```

`mappings` has the following format:
```
{
    "defaults": ...
    "groups": ...
    "mappings": {
        "roles": {
            "groupname_1": Array of Arrays,
            "groupname_2": Array of Arrays,
            "groupname_3": Array of Arrays,
            ...
        },
        "dots": {
            "groupname_4": Array of Strings,
            ...
        }
    }
}
```
Any element of an array `groupname` in the `roles` section is a tuple `[oidcRole, oidcGroup, ... ]` (as returned by the datatracker OIDC user-info API) that will match the `groupname` wiki.js group, e.g.:
```
...
"mappings": {
    "roles": {
        "admins": [
            [
                "ad",
                "iesg",
                ...
            ],
            [
                "chair",
                "ietf",
                ...
            ],
        ],
        "iesg": [
            [
                "ad",
                "iesg"m
                ...
            ],
            [
                "execdir",
                "ietf",
                ...
            ]
        ],
        ...
    }
    ...
}
```
By using wildcards `*` you can omit any tuple element, e.g.:
```
"mappings": {
    "roles": {
        "chairs": [
            [
                "chair",
                "*",
                ...
            ]
        ],
        "iesg-users": [
            [
                "*",
                "iesg",
                ...
            ]
        ],
        ...
    }
    ...
}
```
Any element of an array `groupname` in the mappings `dots` section is an array of strings `[dot1, dot2, ... ]` (as returned by the datatracker OIDC user-info API) that will match the `groupname` wiki.js group, e.g.:
```
"mappings": {
    ...
    "dots": {
        "chairs": [ "llc", ... ],
        ...
    }
    ...
}
```

Any change to the mappings file *should* be detected (checking the last-modified timestamp) when the next authentication request comes in.

To manually reload the configuration head to the *Authentication* strategy configuration on the wiki.js web-gui and hit *Apply*.

# Running tests
```
npm install
npm run test

```
