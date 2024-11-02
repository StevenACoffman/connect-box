# Streaming gRPC on GKE with Gateway API

Steps to deploy gRPC server streaming service running on GKE behind Google's
Global External Application Load Balancer using the Gateway API, Google-managed
certificate and Envoy proxy for TLS termination at the backends.

## Prerequisites

These steps expect GKE cluster with a Gateway Controller [^1] and internet
access (to download the prebuilt container image). Also the usual `gcloud` CLI
configured for your project and `kubectl` with credentials to your cluster.
You'll also need working DNS subdomain to point to the load balancer IP.

## Setup Steps

- Create static IP
  ```shell
  $ gcloud compute addresses create districts-grpc \
    --ip-version=IPV4 \
    --global
  ```

- Point the public DNS to the previously created global IP (I'll be
  using `districts.khanacademy.systems`)

- Create Fully Qualified Google-managed SSL certificate

```
gcloud certificate-manager dns-authorizations create dns-authz-districts-khanacademy-systems \
     --domain="districts.khanacademy.systems"

gcloud certificate-manager dns-authorizations describe dns-authz-districts-khanacademy-systems
 
gcloud config set project khan-internal-services
 
gcloud dns record-sets transaction start --zone="khanacademy-systems"
gcloud dns record-sets transaction add '79a4b2a6-68a8-4263-a366-177ea298fa4f.8.authorize.certificatemanager.goog.' \
    --name="_acme-challenge.districts.khanacademy.systems." \
    --ttl="30" \
    --type="CNAME" \
    --zone="khanacademy-systems"

gcloud dns record-sets transaction execute --zone="khanacademy-systems"

gcloud config set project khan-academy

gcloud certificate-manager certificates create districts-devadmin-ssl \
     --domains="districts.khanacademy.systems" \
     --dns-authorizations=dns-authz-districts-khanacademy-systems

gcloud certificate-manager maps create districts-devadmin-ssl-map

gcloud certificate-manager maps entries create districts-devadmin-ssl-map-entry \
    --map=districts-devadmin-ssl-map \
    --hostname=districts.khanacademy.systems \
    --certificates=districts-devadmin-ssl
    
gcloud certificate-manager maps entries list --map districts-devadmin-ssl-map
```

- Generate self-signed certificate for the backend
  ```shell
  $ openssl ecparam -genkey -name prime256v1 -noout -out key.pem
  $ openssl req -x509 -new -key key.pem -out cert.pem -days 3650 -subj '/CN=internal'
  ```
  TLS is required both between client and GFE, as well as GFE and backend [^2].

  **Important:** The certificate has to use one of supported signatures
  compatible with BoringSSL, see [^3][^4] for more details. 

- Create K8S Secret with the self-signed cert
  ```shell
  $ kubectl -n roster-sync create secret tls grpc-tls \
  --cert=cert.pem \
  --key=key.pem
  ```

- Create K8S Configmap with Envoy config
  ```shell
  $ kubectl -n roster-sync create configmap envoy-config --from-file=envoy.yaml
  ```

- Deploy _grpcdemo_ app
  ```shell
  $ kubectl -n roster-sync apply -f manifests/deploy-grpcdemo.yaml
  ```

  We're using the *Cloud Run gRPC Server Streaming sample application*[^5] which listens on port 8080.
  The Envoy then listens on port 8443 with self-signed certificate.

- Deploy _grpcdemo_ svc
  ```shell
  $ kubectl -n roster-sync apply -f manifests/svc-grpcdemo.yaml
  ```

- Deploy _grpcdemo_ *gke-l7-gxlb* gateway
  ```shell
  $ kubectl -n roster-sync apply -f manifests/gateway-grpcdemo.yaml
  ```

- Deploy _grpcdemo_ HealthCheckPolicy
  ```shell
  $ kubectl -n roster-sync apply -f manifests/httproute-health.yaml
  ```

- Deploy _grpcdemo_ HTTPRoute
  ```shell
  $ kubectl -n roster-sync apply -f manifests/httproute-grpcdemo.yaml
  ```
  *Don't forget to change the DNS in the manifest.*

- Test

  Clone the repository [^5] and build the client:
  ```shell
  $ git clone https://github.com/GoogleCloudPlatform/golang-samples
  $ cd golang-samples/run/grpc-server-streaming
  $ go build -o cli ./client
  ```

  And run the client:
  ```shell
  $ ./cli -server districts.khanacademy.systems:443
  rpc established to timeserver, starting to stream
  received message: current_timestamp: 2023-10-24T19:15:32Z
  received message: current_timestamp: 2023-10-24T19:15:33Z
  received message: current_timestamp: 2023-10-24T19:15:34Z
  ...
  ```


[^1]: https://cloud.google.com/kubernetes-engine/docs/concepts/gateway-api
[^2]: https://cloud.google.com/load-balancing/docs/https#using_grpc_with_your_applications
[^3]: https://github.com/grpc/grpc/issues/6722
[^4]: https://groups.google.com/a/chromium.org/forum/#!msg/blink-dev/kWwLfeIQIBM/9chGZ40TCQAJ
[^5]: https://github.com/GoogleCloudPlatform/golang-samples/tree/main/run/grpc-server-streaming
