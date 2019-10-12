#!/usr/bin/env sh

set -e

# tests - run frontend tests
tests() {
    yarn --cwd ./web/ test
}

start() {
    case $1 in
    f | "")
        startFrontend
        ;;
    b)
        startBackend
        ;;
    *)
        echo "can't start $1, use f - for frontend and b - for backend"
        echo
        exit 1
    esac
}

startFrontend() {
    yarn --cwd ./web/ --no-progress --non-interactive install

    # shellcheck disable=SC2002
    env $(cat .env.local | grep -v '^#' | xargs) yarn --cwd ./web/ --no-progress --non-interactive serve
}

startBackend() {
    buildBackend

    # shellcheck disable=SC2002
    env $(cat .env.local | grep -v '^#' | xargs) ./dist/emu
}

build() {
    case $1 in
    f)
        buildFrontend
        ;;
    b)
        buildBackend
        ;;
    *)
        echo "can't build $1, use f - for frontend and b - for backend"
        echo
        exit 1
        ;;
    esac
}

buildFrontend() {
    env $(cat .env.production | grep -v '^#' | xargs) yarn --cwd ./web/ --frozen-lockfile --no-progress --non-interactive build &> /dev/null
}

buildBackend() {
    LDFLAGS="-X main.Commit=$(git rev-parse --short HEAD) -X main.Date=$(date +%s) -X main.Version=$(git describe)"

    go build -o ./dist/emu -ldflags="$LDFLAGS" ./cmd/emu

    cp .env.production ./dist/env
}

# deploy - send builded application to server
# there are two options, "app" - default and
# "unit" - for deploying systemd service file.
deploy() {
    export ANSIBLE_CONFIG=./deployments/ansible.cfg

    case $1 in
    app | "")
        echo "==== ==================================== =================="
        echo "==== BUILDING FOR $(git describe) VERSION =================="
        echo "==== ==================================== =================="
        echo

        build f
        GOOS=linux GOARCH=amd64 build b

        echo "==== ============== ========================================"
        echo "==== BUILD COMPLETE ========================================"
        echo "==== ============== ========================================"
        echo

        echo "==== ================= ====================================="
        echo "==== DEPLOY APPICATION ====================================="
        echo "==== ================= ====================================="
        echo

        ansible-playbook ./deployments/app.yml
        ;;
    unit)
        echo "==== ================ ======================================"
        echo "==== DEPLOY UNIT FILE ======================================"
        echo "==== ================ ======================================"
        echo

        ansible-playbook ./deployments/unit.yml
        ;;
    *)
        echo "deploy '$1' can't be executed, use 'app' or 'unit'"
        exit 1
    esac

    echo "==== =================== ==================================="
    echo "==== DEPLOYMENT COMPLETE ==================================="
    echo "==== =================== ==================================="
}

# clean - remove temporary building directories
clean() {
    rm -rf ./dist
}

# =========================================================== #

me() {
    echo "./$(basename "$0")"
}

USAGE=$(
    cat <<-END
$(me) - starts application

NAME
    ./app - entrypoint for control

USAGE
    $(me) command sub-command

COMMANDS

    test - run tests for application

    start - start web application

    SUB-COMMANDS

        f - start frontend server
        b - start backend server

    build - build frontend/backend and collect
        results into ./dist directory.

    SUB-COMMANDS

        f - build frontend
        b - start backend

    deploy - deploy application to server. For deploying
        on remote machine you need ssh access. IP
        address into hosts.

        app - application

        unit - systemd unit file

    SUB-COMMANDS

        app - deploy application

        unit - deploy systemd file

    clean - drop build directory
END
)

# ==== entrypoint =========================================== #

if [ ! -d ".git" ]; then
    echo "Script must be starts from root project directory"
    echo "We detect .git directory for checking that)"
    echo
    exit 1
fi

export VUE_APP_CLIENT_VERSION=$(git describe)
export VUE_APP_SERVER_VERSION=$(git describe)

case $1 in
t |test)
    tests
    ;;
s | start)
    start "$2"
    ;;
b | build)
    build "$2"
    ;;
d | deploy)
    deploy "$2"
    ;;
h | help | "")
    echo "$USAGE"
    ;;
c | clean)
    clean
    ;;
*)
    echo "$1 command does not exists, check help or usage"
    echo
    exit 1
    ;;
esac

echo
