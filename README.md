# wiki.js auth module for the IETF
This repository contains the code of a wiki.js authentication module that lets the IETF users login through the datatracker OpenID Connect.


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
    "mappings": Object
}
```
`defaults` contains the list of the groups that will be auto-added to any authenticated users, e.g.:

```
{
    "defaults": ["members", "users"],
    "mappings": {
        ...
    }
}
```

`mappings` has the following format:
```
{
    "defaults": ...
    "mappings": {
        "groupname_1": Array of Arrays,
        "groupname_2": Array of Arrays,
        "groupname_3": Array of Arrays,
        ...
    }
}
```
Any element of an array `groupname` is a couple `[oidcRole, oidcGroup]` (as returned by the datatracker OIDC user-info API) that will match the `groupname` wiki.js group, e.g.:
```
...
"mappings": {
    "admins": [
        [
            "ad",
            "iesg"
        ],
        [
            "chair",
            "ietf"
        ],
    ],
    "iesg": [
        [
            "ad",
            "iesg"
        ],
        [
            "execdir",
            "ietf"
        ]
    ],
    ...
}
```
By using wildcards `*` you can omit an `oidcRole`, an `oidcGroup` or both, e.g.:
```
"mappings": {
    "chairs": [
        [
            "chair",
            "*"
        ]
    ],
    "iesg-users": [
        [
            "*",
            "iesg"
        ]
    ],
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