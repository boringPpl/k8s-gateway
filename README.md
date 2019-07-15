# Minikube
Install Minikube
kubectl apply -f service-account.yaml

# Bash Script

## Minikube Testing
Put it as function in ~/.bash_profile
```
kgw () {
    eval $(minikube docker-env)
    docker build -t k8s-gateway -f Dockerfile.minikube .
    kubectl apply -f minimal-gateway.yaml
    sleep 2

    retries=1
    attempts=5

    while [[ $retries -le $attempts ]]
    do
        trap " " INT
        kubectl logs -f k8s-gateway -n hasbrain
        ok=$?
        trap - INT

        if [[ $ok -eq 130 ]]; then
            retries=$(( $attempts + 1 ))
            echo cleaning up ...
            kubectl delete pod,svc,ingress,secret,daemonset --all -n hasbrain
        else
            echo -e "\nretry $retries ..."
            retryTime=$(($retries**2))
            sleep $retryTime
            retries=$(( $retries + 1 ))
        fi
    done
}
```

## Prod Build
```
npm run build
docker build -t tungph/k8s-gateway .
docker push tungph/k8s-gateway
```