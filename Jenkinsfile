pipeline {
    agent { label 'ecs' }
    stages {
        stage('Set parameters') {
            steps {
                script{
                    echo "GIT_BRANCH: ${GIT_BRANCH}"
                    echo sh(script: 'env|sort', returnStdout: true)
                    if ("${GIT_BRANCH}".contains("feature") || "${GIT_BRANCH}".contains("bugfix") || "${GIT_BRANCH}".contains("devint")) {
                        env.ENVIRONMENT=env.getProperty("environment_devint")
                    } else if("${GIT_BRANCH}".contains("develop")) {
                        env.ENVIRONMENT=env.getProperty("environment_develop")
                    } else if ("${GIT_BRANCH}".contains("master") || "${GIT_BRANCH}".contains("hotfix")) {
                        env.ENVIRONMENT=env.getProperty("environment_prod")
                    }
                    sh """
                    echo "Environment: "${env.ENVIRONMENT}
                    """
                }
            }
        }
        stage('Test'){
            steps {
                script{
                    if ("${GIT_BRANCH}".contains("feature") || "${GIT_BRANCH}".contains("bugfix") || "${GIT_BRANCH}".contains("devint")) {
                        withAWS(credentials: 'bizdev-aws-creds'){
                            sh """
                            npm i -g serverless@1.83.3
                            npm i
                            sls invoke test -s ${env.ENVIRONMENT}
                            """
                    }
                }   else if ("${GIT_BRANCH}".contains("master") || "${GIT_BRANCH}".contains("develop") || "${GIT_BRANCH}".contains("hotfix")){
                        withAWS(credentials: 'omni-aws-creds'){
                            sh """
                            npm i -g serverless@1.83.3
                            npm i
                            sls invoke test -s ${env.ENVIRONMENT}
                            """
                        }
                    }
                }
            }
        }
        stage('BizDev Deploy'){
            when {
                anyOf {
                    branch 'devint';
                    branch 'feature/*';
                    branch 'bugfix/*';
                }
                expression {
                    return true;
                }
            }
            steps {
                withAWS(credentials: 'bizdev-aws-creds'){
                    sh """
                    npm i serverless
                    npm i
                    cd lib/nodejs
                    npm i
                    cd ../..
                    serverless --version
                    sls deploy -s ${env.ENVIRONMENT}
                    """
                }
            }
        }
        stage('Omni Deploy'){
            when {
                anyOf {
                    branch 'master';
                    branch 'hotfix/*';
                    branch 'develop';
                }
                expression {
                    return true;
                }
            }
            steps {
                withAWS(credentials: 'omni-aws-creds'){
                    sh """
                    npm i serverless
                    npm i
                    cd lib/nodejs
                    npm i
                    cd ../..
                    serverless --version
                    sls deploy -s ${env.ENVIRONMENT}
                    """
                }
            }
        }
    }
}