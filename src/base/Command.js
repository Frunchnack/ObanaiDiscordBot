const { Collection, PermissionsBitField } = require("discord.js");
const convertDate = require("../utils/convertDate");
const Context = require("./Context");
const fs = require("fs");

class Command {
    constructor(infos = {
        adminOnly: false,
        aliases: [""],
        args: [],
        category: "",
        cooldown: 10,
        description: "",
        examples: [],
        finishRequest: [],
        name: "",
        ownerOnly: false,
        permissions: 0,
        syntax: "",
    }) {
        this.infos = infos;
        this.client = null;
        this.message = null;
        this.args = null;
        this.ctx = null;

        if (this.infos.finishRequest === "ADVENTURE") {
            const req = [];

            fs.readdirSync("./src/commands")
                .filter(cat => !["administrateur", "utilitaire"].includes(cat))
                .forEach(folder => {
                    const files = fs.readdirSync(`./src/commands/${folder}`);

                    files.forEach(file => req.push(file.replace(".js", "")));
                });

            this.infos.finishRequest = req;
        }
    }

    init(client, message, args) {
        this.client = client;
        this.message = message;
        this.args = args;
        this.ctx = new Context(this.client, this);
    }

    async exe() {
        await this.message.channel.send("this is a default reply.");
    }

    async cooldownReady(forExecuting) {
        let ready = true;
        // ...............................................................................<string, Date>
        if (!this.client.cooldowns.has(this.infos.name)) this.client.cooldowns.set(this.infos.name, new Collection());
        if (!this.client.cooldowns.get(this.infos.name).has(this.message.author.id)) {
            this.client.cooldowns.get(this.infos.name).set(this.message.author.id, Date.now() - this.infos.cooldown * 1000);
        }

        const lastRun = this.client.cooldowns.get(this.infos.name).get(this.message.author.id);
        const tStamp = Date.now();
        const readyForRun = lastRun + this.infos.cooldown * 1000;

        if (tStamp < readyForRun) {
            ready = false;
            await this.ctx.reply(
                "Veuillez patienter.",
                `Merci d'attendre \`${convertDate(readyForRun - tStamp, true).string}\` avant de pouvoir refaire cette commande.`,
                null,
                null,
                "timeout",
            );
        }
        else {
            this.client.cooldowns.get(this.infos.name).delete(this.message.author.id);

            if (forExecuting) setTimeout(() => this.client.cooldowns.get(this.infos.name).set(this.message.author.id, Date.now()), this.command);
        }

        return ready;
    }

    async requestReady() {
        let ready = true;

        if (!this.client.requests.has(this.message.author.id)) this.client.requests.set(this.message.author.id, new Collection());

        // Collection<string, string> avec string[0] = cmd.name et string[1] = lien
        const userRequests = this.client.requests.get(this.message.author.id);
        // Array<string> avec string.prototype = cmd.name
        const neededRequests = this.infos.finishRequest;
        const notFinished = [];

        // ........string of Array<string>
        for (const needed of neededRequests) {
            if (userRequests.filter(req => req.req === needed).map(e => e).length > 0) {
                for (const mulReq of userRequests.filter(req => req.req === needed).map(e => e)) {
                    notFinished.push(mulReq);
                }
            }
        }

        if (notFinished.length > 0) {
            ready = false;
            await this.ctx.reply(
                "Une erreur est survenue.",
                `Vous n'avez pas fini de répondre aux requêtes suivantes :\nt${notFinished.map(req => `[\`${req.req}\`](${req.src})`)}`,
                null,
                null,
                "warning",
            );
        }

        return ready;
    }

    async permissionsReady() {
        const userPermissions = this.message.member.permissionsIn(this.message.channel).toArray();
        if (this.infos.permissions === 0) return true;
        const requiredPermissions = new PermissionsBitField(this.infos.permissions).toArray();

        const hasPerms = requiredPermissions.every(p => userPermissions.includes(p));

        if (!hasPerms) {
            const missingPermissions = requiredPermissions.filter(p => !userPermissions.includes(p));
            await this.ctx.reply(
                "Vous n'avez pas les permissions.",
                "L'exécution de cette commande require des permissions, et il semblerait que vous ne les ayez pas."
                +
                `\nPermissions nécessaires:\n\`\`\`${missingPermissions.join(" / ")}\`\`\``,
                null,
                null,
                "warning",
            );
        }
        return hasPerms;
    }

    async clientPermissionsReady() {
        const clientMember = this.message.guild.members.cache.get(this.client.user.id).permissionsIn(this.message.channel);
        const clientBitfield = new PermissionsBitField(this.client.bitfield).toArray();
        const clientPermissions = clientMember.toArray().filter(p => clientBitfield.includes(p));

        const hasPerms = clientBitfield.every(p => clientPermissions.includes(p));

        if (!hasPerms) {
            const missingPermissions = clientBitfield.filter(p => !clientPermissions.includes(p));
            if (clientMember.has(2048n)) {
                await this.ctx.reply(
                    "Je n'ai pas les permissions.",
                    "L'exécution de cette commande require des permissions, et il semblerait que je ne les ai pas."
                    +
                    `\nPermissions nécessaires:\n\`\`\`${missingPermissions.join(" / ")}\`\`\``,
                    null,
                    null,
                    "error",
                );
            }
        }
        return hasPerms;
    }
}

module.exports = Command;