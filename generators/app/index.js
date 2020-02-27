let Generator = require('yeoman-generator');
const { spawn } = require("child_process");
const { exec } = require("child_process");
const yosay = require('yosay');
let chalk = require('chalk');
let log = console.log;

let errors = [];
let warnings = [];

module.exports = class extends Generator {

    prompting() {
        return this.prompt([
            {
                type: 'input',
                name: 'project_organization',
                message: 'Github Organization/Team Name:'
            },
            {
                type: 'input',
                name: 'module_name',
                message: 'Module Name:'
            },
            {
                type: 'input',
                name: 'project_path',
                message: 'Project Path:',
                default: function (answers) {
                    return process.cwd() + '/' + answers.module_name;
                }
            },
            {
                type: 'checkbox',
                name: 'dependencies',
                message: 'Select Optional Dependencies you want to include:',
                choices: [
                    {
                        name: 'Database',
                        value: 'database'
                    }
                ]
            }]).then((answers) => {
                for (let key in answers) {
                    if (answers.hasOwnProperty(key)) {
                        this[key] = answers[key];
                    }
                }
            }
        );
    }

    writing() {

        //Remove all spaces
        this.project_path = this.project_path; //Ensure this property is available in the install function
        this.module_name = this.module_name.replace(/\s/g, "");
        this.artifact_name = this.module_name;
        let database_name = "db";
        let artifact_name_index = this.module_name.lastIndexOf("/");
        //grab artifact name from module name
        if(artifact_name_index > 0) {
            artifact_name_index += 1;
            this.artifact_name = this.module_name.substring(artifact_name_index);
        }

        this.database_name = this.artifact_name.replace(/_/g,"_").toLowerCase();


        let params = {
            project_organization: this.project_organization,
            module_name: this.module_name,
            artifact_name: this.artifact_name,
            package_name: this.package_name,
            includePostgres: this.dependencies.includes("database"),
            database_info: {
                name: this.database_name,
                host: "localhost",
                port: 5432,
                username: "admin",
                password: "password"
            }
        };

        // Project related directories
        this.fs.copyTpl(
            this.templatePath('docker-compose.yml'),
            this.destinationPath(this.project_path + '/docker-compose.yml'), params);

        if(params.includePostgres) {
            this.fs.copyTpl(
                this.templatePath('init-db.sh'),
                this.destinationPath(this.project_path + '/build/database/init-db.sh'), params);

            this.fs.copyTpl(
                this.templatePath('postgres-dockerfile'),
                this.destinationPath(this.project_path + '/build/database/Dockerfile'), params);

            this.fs.copyTpl(
                this.templatePath('database.go'),
                this.destinationPath(this.project_path + '/internal/platform/database/database.go'), params);

            this.fs.copyTpl(
                this.templatePath('postgres_database.go'),
                this.destinationPath(this.project_path + '/internal/platform/database/postgres_database.go'), params);

            this.fs.copyTpl(
                this.templatePath('health_controller_with_db.go'),
                this.destinationPath(this.project_path + '/internal/health//health_controller.go'), params);
        } else {
            this.fs.copyTpl(
                this.templatePath('health_controller.go'),
                this.destinationPath(this.project_path + '/internal/health//health_controller.go'), params);
        }

        this.fs.copyTpl(
            this.templatePath('router.go.txt'),
            this.destinationPath(this.project_path + '/internal/platform/web/router.go'), params);

        this.fs.copyTpl(
            this.templatePath('main.go'),
            this.destinationPath(this.project_path + '/cmd/main.go'), params);

        this.fs.copyTpl(
            this.templatePath('.gitignore'),
            this.destinationPath(this.project_path + '/.gitignore'), params);

        this.fs.copyTpl(
            this.templatePath('README.md'),
            this.destinationPath(this.project_path + '/README.md'), params);

    }

    install() {

        const cdCommand = "cd "+this.project_path;
        const goModCommand = "go mod init "+this.module_name;
        const goFormatCommand = "go fmt ./...";
        let goModExecCommand = cdCommand  +" && echo 'Executing go mod init command' && "+goModCommand;
        let goFormatExecCommand = cdCommand +" && echo 'Executing go format command' && "+goFormatCommand;

        //todo: execute go commands
    }

    end() {
        let numErrors = errors.length > 0 ? "with error(s)." : ".";
        let errorString = "";
        let warnString = "";
        errors.forEach(error => {
            errorString = "\n"+ errorString + error;
        });
        warnings.forEach(warn => {
            warnString = "\n"+ warnString + warn;
        });

        log(yosay("Your new service [" + this.artifact_name + "] ("+this.module_name +")  has been created at "
                  + this.project_path + "    "  + numErrors + warnString + errorString
                  + "\nSome configurations need to be updated manually. ",
                  {"maxLength": 90}));
    }
};
