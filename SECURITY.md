# Security

## Reporting a vulnerability

Please report security problems privately through GitHub: Security tab, then "Report a vulnerability". Do not open a public issue for them.

## Scope

This package is a read-only proxy to the public SaaS Puppy MCP endpoint. It holds no credentials, reads no files and writes no data. The upstream address must use `https` (plain `http` is accepted only for `localhost`). In HTTP mode it reads request bodies up to 1 MB and keeps no per-client state.

Issues in the SaaS Puppy website or its database belong to the site, not this package. Report those to the same address.
