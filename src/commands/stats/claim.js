const Command = require("../../base/Command");

class Claim extends Command {
    constructor() {
        super({
            category: "Stats",
            cooldown: 5,
            description: "Commande permettant de récupérer son bonus de grade.",
            finishRequest: "ADVENTURE",
            name: "claim",
            private: "none",
            permissions: 0n,
        });
    }

    async run() {
        const pExists = await this.client.playerDb.started(this.message.author.id);
        if (!pExists) {
            return await this.ctx.reply("Vous n'êtes pas autorisé.", "Ce profil est introuvable.", null, null, "error");
        }

        const eDatas = await this.client.externalServerDb.get(this.message.author.id);
        if (eDatas.grades.length === 0) {
            return await this.ctx.reply("Oups...", "Vous n'avez aucun grade.", null, null, "warning");
        }

        const canBeClaimed = eDatas.grades.filter(g => !eDatas.claimed.includes(g));
        if (canBeClaimed.length === 0) {
            return await this.ctx.reply("Oups...", "Vous avez déjà récupéré toutes les récompenses de grade.", null, null, "warning");
        }

        let str = "";
        for (const grade of canBeClaimed) {
            switch (grade) {
                case "vip":
                    await this.client.inventoryDb.addGrimoire(eDatas.id, "mastery");
                    await this.client.inventoryDb.addGrimoire(eDatas.id, "eternal");
                    await this.client.inventoryDb.db.math(eDatas.id, "+", 50000, "yens");

                    await this.client.playerDb.db.math(eDatas.id, "+", 2, "stats.strength");
                    await this.client.playerDb.db.math(eDatas.id, "+", 2, "stats.agility");
                    await this.client.playerDb.db.math(eDatas.id, "+", 2, "stats.speed");
                    await this.client.playerDb.db.math(eDatas.id, "+", 2, "stats.defense");
                    str += "**BONUS VIP**\nGrimoire de maîtrise +1\n";
                    str += "Grimoire éternel +1\n+50'000 ¥\n+2 niveau d'aptitude";
                    break;
                case "vip+":
                    await this.client.inventoryDb.addGrimoire(eDatas.id, "mastery");
                    await this.client.inventoryDb.db.math(eDatas.id, "+", 100000, "yens");

                    await this.client.playerDb.db.math(eDatas.id, "+", 5, "stats.strength");
                    await this.client.playerDb.db.math(eDatas.id, "+", 5, "stats.agility");
                    await this.client.playerDb.db.math(eDatas.id, "+", 5, "stats.speed");
                    await this.client.playerDb.db.math(eDatas.id, "+", 5, "stats.defense");
                    str += "\n\n**BONUS VIP(+)**\nGrimoire de maîtrise +1\n+100'000 ¥\n+5 niveau d'aptitude";
                    break;
            }
        }

        this.client.externalServerDb.db.set(eDatas.id, canBeClaimed.concat(eDatas.claimed), "claimed");

        return await this.ctx.reply("Récupérer vos récompenses de grade.", str, "🪙", null, "outline");
    }
}

module.exports = Claim;