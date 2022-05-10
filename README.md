<div align="center">
    
<img src="https://raw.githubusercontent.com/ietf-tools/common/main/assets/logos/ietf-wikijs-auth.svg" alt="IETF Wiki.js Auth" height="125" />
    
[![License](https://img.shields.io/github/license/ietf-tools/ietf-wikijs-auth)](https://github.com/ietf-tools/ietf-wikijs-auth/blob/main/LICENSE)

##### IETF Authentication Module for Wiki.js
    
</div>

---

This repository contains the code of a Wiki.js authentication module that lets the IETF users login through the Datatracker OpenID Connect.

- [Production Usage](#production-usage)
  - [Initial Setup](#initial-setup)
  - [Non-Docker Usage](#non-docker-usage)
- [Docker Dev Environment](#docker-dev-environment)
- [Mappings](#mappings)
- [Running Tests](#running-tests)
- [Releasing a New Build](#releasing-a-new-build)

### Production Usage

Use the following docker image which contains the IETF Datatracker authentication module:
```
ghcr.io/ietf-tools/wiki:latest
```

#### Initial Setup

1. Head to Wiki.js **Administration Area** and validate that all groups specified in `mappings.json` have been added under **Groups**. Missing groups are automatically created during initialization.
2. Still under **Groups**, add the necessary page rules / permissions for all groups.

    > ***Note that groups must NOT be renamed. They must match exactly as they are in `mappings.json`.***
3. Under **Authentication** settings add the strategy **IETF datatracker OpenID Connect**
    * Enable *Allow self-registration*
    * Complete the configuration with the IETF provider settings
    * Ensure that the machine is reachable to the strategy *callback URL*

#### Non-Docker Usage

Copy the whole `ietf` folder under the path `server/modules/authentication/` of your wiki.js instance.

### Docker Dev Environment

1. `docker-compose up`
2. Complete the initial setup of wiki.js by connecting to `http://HOST:PORT` (default `PORT` is 1926)
3. Create a homepage
4. Head to wiki.js **Administration** settings and add the groups specified in `mappings.json`
5. Create the group rules if you need to enforce the permission system
6. Under **Authentication**, add the strategy **IETF datatracker OpenID Connect**
    * Enable *Allow self-registration*
    * Complete the configuration with the IETF provider settings
    * Ensure that the machine is reachable to the strategy *callback URL*

### Mappings

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

### Running tests

```sh
npm install
npm run test
```

### Releasing a New Build

To release a new docker image, go to the **Actions** tab, select the **Build and Release** workflow and click **Run workflow**.
