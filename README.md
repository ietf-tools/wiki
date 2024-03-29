<div align="center">
    
<img src="https://raw.githubusercontent.com/ietf-tools/common/main/assets/logos/ietf-wikijs.svg" alt="IETF Wiki.js" height="125" />
    
[![License](https://img.shields.io/github/license/ietf-tools/ietf-wikijs-auth)](https://github.com/ietf-tools/ietf-wikijs-auth/blob/main/LICENSE)

##### Custom Wiki.js image for IETF wikis
    
</div>

---

This repository contains the custom IETF modules for Wiki.js, packaged into a docker container image.

- [Deployment](#deployment)
- [Modules](#modules)
  - [Authentication - IETF Datatracker](#authentication---ietf-datatracker)
    - [Initial Setup](#initial-setup)
    - [Mappings](#mappings)
  - [Rendering - IETF Custom](#rendering---ietf-custom)
- [Docker Dev Environment](#docker-dev-environment)
- [Running Tests](#running-tests)
- [Releasing a New Build](#releasing-a-new-build)

## Deployment

Once on the server:

1. Create a new bridge network so that containers can find each other:
```bash
docker network create wikinet
```
2. Create the wiki-update-companion container:
```bash
docker run -d --name=wiki-update-companion -v /var/run/docker.sock:/var/run/docker.sock:ro --restart=unless-stopped -h wiki-update-companion --network=wikinet ghcr.io/ietf-tools/wiki-update-companion:latest
```

For each Wiki.js instance:
    
1. Create a container, replacing the following `xyz123` values in the command below:

```bash
docker run -d --name=xyz123 -e DB_HOST=xyz123 -e DB_PORT=5432 -e DB_PASS=xyz123 -e DB_USER=xyz123 -e DB_NAME=wiki -e UPGRADE_COMPANION_REF=xyz123 -h xyz123 -p 80:3000 -v /xyz123/mappings.json:/wiki/server/modules/authentication/ietf/mappings.json:ro --network=wikinet --restart=unless-stopped ghcr.io/ietf-tools/wiki:latest
```

- `--name=xyz123` -> Name of the instance, should be unique for each container, e.g. `--name=wiki-ietf`
- `-e DB_HOST=xyz123` -> Hostname / IP of the PostgreSQL database server. (if database is on the host, see [Database on Localhost](#database-on-localhost) below.)
- `-e DB_PORT=5432` -> Port of the PostgreSQL database server.
- `-e DB_USER=xyz123` -> Username to connect to the PostgreSQL database server.
- `-e DB_PASS=xyz123` -> Password to connect to the PostgreSQL database server.
- `-e DB_NAME=wiki` -> Database name on the PostgreSQL server.
- `-e UPGRADE_COMPANION_REF=xyz123` -> Name reference to this container for the upgrade tool. Should be identical to the container name entered above (e.g. `-e UPGRADE_COMPANION_REF=wiki-ietf`).
- `-h xyz123` -> Hostname of the container instance. Should be identical to the container name entered above (e.g. `-h wiki-ietf`).
- `-p 80:3000` -> Change `80` to the desired port to expose. The port should be unique for each container. Do not change the `3000` value, this is the internal container port!
- `-v /xyz123/mappings.json:...` -> Path on the server (host) to the mappings.json file. This file will be mounted into the container.
- `--network=wikinet` -> Name of the bridge network created earlier.

2. Ensure the container started correctly by running (replacing `xyz123` with the name of the container):
```bash
docker logs xyz123 -f
```

The output should include the line `HTTP Server: [ RUNNING ]`

3. Add the proper config to your reverse-proxy software (e.g. nginx / apache) to point each domain to the correct port you exposed above.

4. If this is a new Wiki.js instance, complete the setup by loading the domain name in your browser.

### Database on localhost

Note that you cannot use `localhost` or `127.0.0.1` as the `DB_HOST` value to communicate to a PostgreSQL server installed on the host itself, as localhost refers to the container itself, not the host. You must instead add the following to the docker run command *(note that there's nothing to replace in the command below, `host-gateway` is a special docker keyword!)*:

```bash
--add-host=host.docker.internal:host-gateway
```

This will add a DNS entry in the container that automatically points to the Docker host IP address. You can then specify `host.docker.internal` as the host for the `DB_HOST` parameter.

## Modules

### Authentication - IETF Datatracker

> **Note**  
> The `mappings.json` provided in this repository is only an example and should be modified to match the target instance use case.

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

#### Mappings

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

Any change to the mappings file requires a restart of the container while in dev mode.

### Rendering - IETF Custom

This rendering module ensures that any references to RFC's or Internet Drafts are automatically linked to their corresponding Datatracker page.

This module should be enabled by default under the Administration Area > Rendering > HTML

## Docker Dev Environment

1. `docker-compose up`
2. Complete the initial setup of wiki.js by connecting to `http://HOST:PORT` (default `PORT` is 1926)
3. Create a homepage
4. Head to wiki.js **Administration** settings and add the groups specified in `mappings.json`
5. Create the group rules if you need to enforce the permission system
6. Under **Authentication**, add the strategy **IETF datatracker OpenID Connect**
    * Enable *Allow self-registration*
    * Complete the configuration with the IETF provider settings
    * Ensure that the machine is reachable to the strategy *callback URL*

## Running tests

```sh
npm install
npm run test
```

## Releasing a New Build

To release a new docker image, go to the **Actions** tab, select the **Build and Release** workflow and click **Run workflow**.
