const makeEmbed = require("../../functions/embed");
const checkRoles = require("../../functions/Response based Checkers/checkRoles");
const mongo = require("../../mongo");
let cache = require("../../caches/botCache").guildsCache
const serversSchema= require("../../schemas/servers-schema");


const Command = require("../../Classes/Command");

let hostRole = new Command("host-role");
hostRole.set({
    
	aliases         : ["hostR","hostrole","hrole"],
	description     : "Sets the role that will be able to use the !host command.",
	usage           : "host-role",
	cooldown        : 5,
	unique          : false,
	category        : "ms",
	whiteList       : "ADMINISTRATOR",
	worksInDMs      : false,
	isDevOnly       : false,
	isSlashCommand  : false
})



hostRole.execute = async function (message, args, server) { 

    let servery = cache[message.guild.id];

        
        
    if(!server.hostRole || server.hostRole === ""){

    
        const embed = makeEmbed("White listed role.",`Ping the role that you want to be able to use the host command.\nType \`no\` for no one except admins.`, server);
    
        message.channel.send({embeds: [embed]});
        const messageFilter = m => !m.author.bot && m.author.id === message.author.id;
        message.channel.awaitMessages({filter: messageFilter, max: 1, time : 120000, errors: ['time']})
            .then(async (a) => {
                let checkedRole = checkRoles(a);
                switch (checkedRole) {
                    case "not valid":
                    case "not useable":
                    case "no args":               
                        message.channel.send("Invalid argument, command failed.");
                        return false;
                        break;
                    case "cancel":
                    case "no":
                        servery.hostRole = "";
                        break;
                    default:     
                        servery.hostRole = checkedRole;
                        break;
                    }                                        

                    await mongo().then(async (mongoose) =>{
                        try{
                            await serversSchema.findOneAndUpdate({_id:message.guild.id},{
                                hostRole: servery.hostRole
                            },{upsert:true});
                        } finally{
                            console.log("WROTE TO DATABASE");
                            mongoose.connection.close();
                        }
                    })
                    cache[message.guild.id] = servery;

                    const embed = makeEmbed(`✅ Host role has been updated.`,`Poeple with the role <@&${servery.hostRole}> can now use the  \`${server.prefix}host\` command`, "#24D900");
                    message.channel.send({embeds: [embed]});
                    return true;
            });
    } else{
        const embed = makeEmbed(`You already have a host role set.`,`Your current host role is <@&${server.hostRole}>**\nType \`reset\` to reset it..**`, server);
        message.channel.send({embeds: [embed]});
        const gayFilter = m => !m.author.bot && m.author.id === message.author.id;
        message.channel.awaitMessages({filter: gayFilter,max: 1, time : 20000, errors: ['time']})
        .then(async (a) => {
            if(a.first().content === "reset"){
                await mongo().then(async (mongoose) =>{
                    try{ 
                        await serversSchema.findOneAndUpdate({_id:message.guild.id},{
                            hostRole: null
                        },{upsert:true});
                        servery.hostRole = null;
                        cache[message.guild.id] = servery;
                    } finally{
                        message.channel.send("Role has been reset");
                        console.log("WROTE TO DATABASE");
                        mongoose.connection.close();
                    }
                });
                return true;
                
            }else return false;
        })
        
    }           
}
    module.exports = hostRole;