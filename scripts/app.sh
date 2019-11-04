#!/usr/bin/env sh

set -e

# tests - run frontend tests
tests() {
    yarn --cwd ./web/ test
}

start() {
    yarn --cwd ./web/ --no-progress --non-interactive install
    yarn --cwd ./web/ --no-progress --non-interactive serve
}

build() {
    yarn --cwd ./web/ --frozen-lockfile --no-progress --non-interactive build &> /dev/null
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

    build - build frontend and collect
        results into ./dist directory.

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

case $1 in
t |test)
    tests
    ;;
s | start)
    start
    ;;
b | build)
    build
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
