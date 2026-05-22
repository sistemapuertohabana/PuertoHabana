#!/bin/bash
if ! pgrep -x "mysqld" > /dev/null
then
    echo "Iniciando MySQL en espacio de usuario..."
    mysqld_safe --skip-grant-tables &
    sleep 5
fi
