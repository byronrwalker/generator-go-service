#!/bin/bash

# Export database configuration variables to be used when container boots up
export PGDATABASE='<%= database_info.name %>'
export PGUSER='<%= database_info.username %>'
export PGPASSWORD='<%= database_info.password %>'

printf '\nInitializing database\n'

