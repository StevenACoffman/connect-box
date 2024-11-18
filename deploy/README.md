# Streaming gRPC on GKE with Gateway API

Steps to deploy gRPC server streaming service running on GKE behind Google's
Global External Application Load Balancer using the Gateway API, Google-managed
certificate and Envoy proxy for TLS termination at the backends.

Adapted from https://github.com/stepanstipl/gke-grpc-gateway-api and https://github.com/GoogleCloudPlatform/kubernetes-engine-samples/tree/main/networking/grpc-gke-nlb-tutorial

## Prerequisites

These steps expect GKE cluster with a Gateway Controller [^1] and internet
access (to download the prebuilt container image). Also the usual `gcloud` CLI
configured for your project and `kubectl` with credentials to your cluster.
You'll also need working DNS subdomain to point to the load balancer IP.

## Setup Steps

- Create static IP in `khan-academy` GCP Project
  ```shell
  $ gcloud compute addresses create districts-play \
    --ip-version=IPV4 \
    --global
  $ gcloud compute addresses list \
    --filter="name=( 'districts-play')" --global
  ```

- Point the public DNS to the previously created global IP (I'll be
  using `play.khanacademy.systems`)
  ```shell
  gcloud dns --project=khan-internal-services record-sets transaction start --zone="khanacademy-systems"
  gcloud dns --project=khan-internal-services record-sets transaction add 35.227.209.195 \
  --name=play.khanacademy.systems \
  --ttl=300 \
  --type=A \
  --zone=khanacademy-systems
  gcloud dns --project=khan-internal-services record-sets transaction execute --zone="khanacademy-systems"
  ```
- Speed up stuff with a SVCB (HTTPS) record:
  ```shell
  gcloud dns --project=khan-internal-services record-sets create play.khanacademy.systems. --zone="khanacademy-systems" --type="HTTPS" --ttl="300" --rrdatas="1 . alpn=h2,h3 ipv4hint=35.227.209.195"
  ```

- Create Fully Qualified Google-managed SSL certificate

```
gcloud certificate-manager dns-authorizations create dns-authz-play-khanacademy-systems \
     --domain="play.khanacademy.systems"

gcloud certificate-manager dns-authorizations describe dns-authz-play-khanacademy-systems
 
gcloud config set project khan-internal-services
 
gcloud dns --project=khan-internal-services record-sets transaction start --zone="khanacademy-systems"
gcloud dns --project=khan-internal-services record-sets transaction add 'XXXXX.X.authorize.certificatemanager.goog.' \
    --name="_acme-challenge.play.khanacademy.systems." \
    --ttl="30" \
    --type="CNAME" \
    --zone="khanacademy-systems"

gcloud dns --project=khan-internal-services record-sets transaction execute --zone="khanacademy-systems"

gcloud config set project khan-academy

gcloud certificate-manager certificates create districts-play-devadmin-ssl \
     --domains="play.khanacademy.systems" \
     --dns-authorizations=dns-authz-play-khanacademy-systems

gcloud certificate-manager maps create districts-play-devadmin-ssl-map

gcloud certificate-manager maps entries create districts-play-devadmin-ssl-map-entry \
    --map=districts-play-devadmin-ssl-map \
    --hostname=play.khanacademy.systems \
    --certificates=districts-play-devadmin-ssl
    
gcloud certificate-manager maps entries list --map districts-play-devadmin-ssl-map
```

- Generate self-signed certificate for the backend
  ```shell
  $ openssl ecparam -genkey -name prime256v1 -noout -out key.pem
  $ openssl req -x509 -new -key key.pem -out cert.pem -days 3650 -subj '/CN=internal'
  ```
  TLS is required both between client and GFE, as well as GFE and backend [^2].

  **Important:** The certificate has to use one of supported signatures
  compatible with BoringSSL, see [^3][^4] for more details. 

- Create the K8S namespace
  ```shell
  $ kubectl create namespace play
  ```
- Create K8S Secret with the self-signed cert
  ```shell
  $ kubectl -n play create secret tls play-tls \
  --cert=cert.pem \
  --key=key.pem
  ```

- Create K8S Configmap with Envoy config
  ```shell
  $ kubectl -n play apply -f manifests/configmap-envoy.yaml
  # this is same as:
  # kubectl -n play create configmap envoy-config --from-file=envoy.yaml
  ```

- Deploy _play_ app
  ```shell
  $ kubectl -n play apply -f manifests/deploy-play.yaml
  ```

  We're using the *Cloud Run gRPC Server Streaming sample application*[^5] which listens on port 8080.
  The Envoy then listens on port 8443 with self-signed certificate.

- Deploy _play_ svc
  ```shell
  $ kubectl -n play apply -f manifests/svc-play.yaml
  ```

- Deploy Gateway Policy
  ```shell
  $ kubectl -n play apply -f manifests/gateway-policy.yaml
  ```

- Deploy _play_ *gke-l7-gxlb* gateway
  ```shell
  $ kubectl -n play apply -f manifests/gateway-play.yaml
  ```

- Deploy _play_ HealthCheckPolicy
  ```shell
  $ kubectl -n play apply -f manifests/httproute-health-play.yaml
  ```

- Deploy _play_ HTTPRoute
  ```shell
  $ kubectl -n play apply -f manifests/httproute-play.yaml
  ```
  *Don't forget to change the DNS in the manifest.*

- Test
  Go to https://play.khanacademy.systems and verify it works!

Other Envoy config examples are available in [^6].

[^1]: https://cloud.google.com/kubernetes-engine/docs/concepts/gateway-api
[^2]: https://cloud.google.com/load-balancing/docs/https#using_grpc_with_your_applications
[^3]: https://github.com/grpc/grpc/issues/6722
[^4]: https://groups.google.com/a/chromium.org/forum/#!msg/blink-dev/kWwLfeIQIBM/9chGZ40TCQAJ
[^5]: https://github.com/GoogleCloudPlatform/golang-samples/tree/main/run/grpc-server-streaming
[^6]: https://github.com/envoyproxy/envoy/blob/main/configs/envoyproxy_io_proxy_http3_downstream.yaml
