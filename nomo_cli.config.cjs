const nomoCliConfig = {
  deployTargets: {
    production: {
      rawSSH: {
        sshHost: process.env.SSH_TARGET,
        sshBaseDir: "/var/www/production_webons/avinocdefi/",
        publicBaseUrl: "https://w.nomo.app/avinocdefi",
      },
    },
  },
};

module.exports = nomoCliConfig;
