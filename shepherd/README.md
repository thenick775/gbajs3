# Shepherd

An optional swarm manager service that watches for updated images and deploys them. It is not part of the normal local dev compose stack, only for swarm.

## Requirements

- Docker swarm mode
- A manager node
- Access to the manager's Docker socket
- A registry credentials file when pulling private images

## Configuration

The service attempts to update images from a registry, rolls back failed updates, and retains one prior image as configured.

Create `shepherd/shepherd-registries` according to the defined format in the [shepherd docs](https://github.com/containrrr/shepherd). The Swarm Compose file exposes it as the `shepherd-registries` secret.

Set `REGISTRY_PREFIX` in `.env.swarm` to check and pull published images, for example with ghcr:

```sh
export REGISTRY_PREFIX=ghcr.io/<owner>/<repository>/
```

See: [shepherd docs](https://github.com/containrrr/shepherd) for full configuration details.

## Include in the swarm deployment

For automated registry image updates, add this file to the root README's `docker stack deploy` command:

```sh
-c ./shepherd/docker-compose.yaml
```
