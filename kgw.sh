#!/bin/bash
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
        kubectl delete pod,svc,ingress,daemonset --grace-period=0 --force --all -n hasbrain
    else
        echo -e "\nretry $retries ..."
        retryTime=$(($retries**2))
        sleep $retryTime
        retries=$(( $retries + 1 ))
    fi
done