## Testing
1. Run the validator using
```bash
solana-test-validator --url mainnet-beta --clone 7UVimffxr9ow1uXYxsr4LHAcV58mLzhmwaeKvJ1pjLiE --bpf-program rec5EKMGg6MxZYaMdyBfgwp4d5rB9T1VQH5pJv5LtFJ pyth.so -r
```
2. Run test
```bash
anchor test --skip-local-validator
```
Alternatively run with docker
```bash
docker compose run anchor build
```