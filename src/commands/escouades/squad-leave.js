const Command = require("../../base/Command");
const MemberScanning = require("../../structure/tools/MemberScanning");

class SquadLeave extends Command {
    constructor() {
        super({
            adminOnly: false,
            aliases: ["squad-leave", "sq-lv"],
            args: [],
            category: "Escouades",
            cooldown: 10,
            description: "Commande permettant de quitter son escouade.",
            examples: ["squad-leave"],
            finishRequest: "ADVENTURE",
            name: "squad-leave",
            ownerOnly: false,
            permissions: 0,
            syntax: "squad-leave",
        });
    }

    async run() {
        const pExists = await this.client.playerDb.started(this.message.author.id);
        if (!pExists) return await this.ctx.reply("Vous n'êtes pas autorisé.", "Ce profil est introuvable.", null, null, "error");

        const pDatas = await this.client.playerDb.get(this.message.author.id);
        if (pDatas.squad === null) return await this.ctx.reply("Aucune escouade.", "Aucune escouade n'a été trouvée pour ce joueur.", null, null, "info");

        const sDatas = await this.client.squadDb.get(pDatas.squad);
        if (sDatas.owner === this.message.author.id) return await this.ctx.reply("Vous n'avez pas l'autorisation.", "En tant que **Chef d'escouade**, votre seul moyen de quitter est de supprimer votre escouade.", null, null, "info");

        const msg = await this.ctx.reply("Doit-on lui dire au revoir ?", `Souhaitez-vous vraiment quitter l'escouade **${sDatas.name}** ?`, null, null, "info");
        const choice = await this.ctx.reactionCollection(msg, ["❌", "✅"]);

        if (choice === "✅") {
            if ((await this.client.squadDb.hasPlayer(sDatas.owner, pDatas.id)) === false) return await this.ctx.reply("Doit-on lui dire au revoir ?", "Ce joueur ne fait pas partie de l'escouade.", null, null, "info");
            await this.client.squadDb.leaveSquad(sDatas.owner, pDatas.id);
            return await this.ctx.reply("Doit-on lui dire au revoir ?", "Le joueur a quitté l'escouade.", null, null, "success");
        }
        else if (choice === "❌") {
            return await this.ctx.reply("Doit-on lui dire au revoir ?", "Le joueur n'a pas quitté l'escouade.", null, null, "info");
        }
        else if (choice === null) {
            return await this.ctx.reply("Doit-on lui dire au revoir ?", "Vous avez mis trop de temps à répondre, la commande a été annulée.", null, null, "timeout");
        }

    }
}

module.exports = new SquadLeave();