# hackathon-khanmigogo - Jackbox-style collaborative real time classroom activities

Real Time Collaboration Games... with gRPC and HTTP/2 or HTTP/3!

This is a GameHub for a number of Jackbox-style collaborative realtime games.
Right now, only poll Battle works, but it shouldn't be too hard to add more.

## Local dev environment dependencies
We expect you have these things installed:
```
brew install go node typescript yarn
```
## Starting the App
```
cd ui
yarn install
yarn build
cd ..
go run main.go
```

Then navigate to http://localhost:8080 and start a poll battle
## Getting Buf build working
You can probably just run:
```
./generate.sh
```
But if you want to globaly install everything, assuming you have go installed, you can do this:
```
npm install --g @bufbuild/buf @bufbuild/protoc-gen-es@v2.2.2
export GOBIN=~/khan/webapp/genfiles/go/bin
go install github.com/bufbuild/buf/cmd/buf@latest
go install github.com/fullstorydev/grpcurl/cmd/grpcurl@latest
go install google.golang.org/protobuf/cmd/protoc-gen-go@latest
go install connectrpc.com/connect/cmd/protoc-gen-connect-go@latest
```
Then you should be able to run `buf generate` or `buf lint` assuming your global node
install bin directory is in your path.


## Running the Poll Battle locally

- Build the React app by running `cd ui && npm install && npm run build`
  - The React app can also be built by running `docker build . --output "$(pwd)/ui/build" --target copytohost`
- Run the server with `go run main.go`
- Navigate to http://localhost:8080

## Modifying the poll battle game protobuf

- The protobufs for the poll battle game are defined in `./ui/src/proto/chat.proto` and `./server/chat/v1/chat.proto`
- If changes are made to these, then Buf compiler needs to be run again. In the directory where the `buf.gen.yaml` file is defined, run the following commands:
  - (Optional) `buf lint` and `buf format` to lint/format the protobuf files
  - `buf generate` to generate the connect RPC code
  - More details for Buf's CLI can be found [here](https://buf.build/docs/ecosystem/cli-overview)

## Deploying to prod
Run:
```
./build.sh
```
This will rebuild the assets in prod mode, and then push a docker container.
Updating kubernetes manifests is manual for now.