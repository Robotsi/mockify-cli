# Demo Recording

To add a demo GIF to the README, record a short terminal session:

```bash
# Install asciinema (macOS)
brew install asciinema

# Record
asciinema rec mockify-demo.cast

# Inside the recording:
npx mockify-cli init --dir /tmp/mockify-demo
npx mockify-cli start --dir /tmp/mockify-demo --port 4000
# In another terminal:
curl http://localhost:4000/users
```

Convert to GIF with [asciicast2gif](https://github.com/asciinema/asciicast2gif) and add to README:

```markdown
![Demo](docs/demo.gif)
```
