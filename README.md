# Minikube
Install Minikube

kubectl apply -f service-account.yaml

kubectl create secret generic flownote-key-pub --from-file=./test/secrets/key.pub -n hasbrain

# Bash Script

## Minikube Testing
Run end-to-end test `./kgw.sh`

## Prod Build
```
git checkout master
npm run build
docker build -t tungph/k8s-gateway .
docker push tungph/k8s-gateway
```

## Stg Build
```
git checkout develop
npm run build
docker build -t tungph/k8s-gateway-stg .
docker push tungph/k8s-gateway-stg
```
