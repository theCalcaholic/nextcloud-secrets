# nc-secrets

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
