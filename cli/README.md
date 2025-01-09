<!--
SPDX-FileCopyrightText: Tobias Knöppler <thecalcaholic@web.de>
SPDX-License-Identifier: CC0-1.0
-->

# nc-secrets

## Usage

```sh
Usage: nc-secrets [options] [command]

cli for https://apps.nextcloud.com/apps/secrets

Options:
  -k, --insecure                                         Disable SSL certificate validation (FOR TESTING ONLY)
  -h, --help                                             display help for command

Commands:
  create [options] <nextcloud-url> <user> <secret-file>  Create a new secret
  retrieve [options] <secret-url>                        Retrieve a secret and print it to stdout
  info <nextcloud-url>                                   Get information about a Nextcloud Secrets API
  help [command]                                         display help for command
```

### Create

```sh
Usage: nc-secrets create [options] <nextcloud-url> <user> <secret-file>

Create a new secret

Arguments:
  nextcloud-url                URL of your Nextcloud server
  user                         Your nextcloud user
  secret-file                  path to a file containing your secret

Options:
  -P, --pass-file <pass-file>  Read nextcloud password from file at given path (default: stdin)
  -E, --expire <days>          Expire secret in given number of days
  -p, --protect <password>     Protect the secret share with the given password
  -t, --title <title>          Title of the secret
  -h, --help                   display help for command
```

#### Example:

Assuming you want to create a secret share of the content of a file ./my-secret and the environment variable NC_PASS
contains a Nextcloud password (or app token) for user 'sharer' at a Nextcloud instance with the URL https://nextcloud.foss, 
you could use the following command:

```sh
./nc-secrets create -t 'My Secret' https://nextcloud.foss sharer ./my-secret <<<"$NC_PASS"
```

### Retrieve

```sh
Usage: nc-secrets retrieve [options] <secret-url>

Retrieve a secret and print it to stdout

Arguments:
  secret-url                  URL of the secret to be retrieved (either the secret share or ocs URL)

Options:
  -d, --key <decryption-key>  Secret decryption key (only required if not part of <secret-url>)
  -p, --password <password>   password in case the secret is password protected
  -h, --help                  display help for command
```

### Info

```sh
Usage: nc-secrets info [options] <nextcloud-url>

Get information about a Nextcloud Secrets API

Arguments:
  nextcloud-url  Address of the secrets API

Options:
  -h, --help     display help for command
```

## Development

To install dependencies:

```bash
bun install
```

To run:

```bash
bun run cli.ts
```

To compile (single executable):

```bash
bun build --compile ./cli.ts --outfile nc-secrets
```

This project was created using `bun init` in bun v1.0.7. [Bun](https://bun.sh) is a fast all-in-one JavaScript runtime.

### Run locally

Testing in development setup
```sh
echo '<nc-password>' | bun run cli.ts -k create -E 5 -p verysecret http://localhost:8210 <nc-user> <(echo 'mysecret')
```
