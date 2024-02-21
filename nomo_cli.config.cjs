const nomoCliConfig = {
  deployTargets: {
    production: {
      rawSSH: {
        sshHost: process.env.SSH_TARGET,
        sshBaseDir: "/var/www/production_webons/neocreditdefi/",
        publicBaseUrl: "https://nrt.st",
        hybrid: true,
      },
    },
  },
};

module.exports = nomoCliConfig;
