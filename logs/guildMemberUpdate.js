const moment = require('moment');
const Discord = require('discord.js'); 

const mongo = require("../mongo");
let guildsCache = require("../caches/guildsCache");
const serversSchema = require("../schemas/servers-schema");

module.exports = async (oldMember, newMember)=> {
	try {

		let i = guildsCache[oldMember.guild.id];
		if(!i){
			await mongo().then(async (mongoose) =>{
				try{ 
					guildsCache[oldMember.guild.id] =i = await serversSchema.findOne({_id:oldMember.guild.id});
				} finally{
					console.log("FETCHED FROM DATABASE");
					mongoose.connection.close();
				}
			});
		}
		const log = oldMember.guild.channels.cache.get(i.logs.hiByeLog);
			
		if (typeof log !== 'undefined') {
			const embed = new Discord.MessageEmbed()
			.setTitle('member updated')
			.setFooter('Developed by Crazy4K')
			.setTimestamp()
			.setColor('#02A3F4')
			.addFields({name: "ID: ",value: oldMember.user.id,inline:true},
			{name: "Tag: ",value: `<@${oldMember.user.id}>`,inline:true})
			.setAuthor(oldMember.displayName, oldMember.user.displayAvatarURL());
			let size = 0;
			if(oldMember.nickname !== newMember.nickname){
				embed.addField("Nickname before: ", oldMember.nickname,false);
				embed.addField("Nickname after: ", newMember.nickname,false);
				size++;
			}
			let oldDif = [];
			let newDif = [];
			oldMember.roles.cache.each((a)=>{oldDif.push(a.id)});
			newMember.roles.cache.each((a)=>{newDif.push(a.id)});
			oldDif.pop();
			newDif.pop();
			if(oldDif.toString() !== newDif.toString()){
				
				let objOfRoles = {};

				let twoDiffs= oldDif.concat(newDif);
				twoDiffs.forEach((item)=>{
					if(objOfRoles[item])objOfRoles[item]++;
					else objOfRoles[item] = 1;
				});

				let difference;
				for (const I in objOfRoles) {
					if(objOfRoles[I] === 1)difference = I;
				}
				let addedOrRemoved = "";
				if(oldDif.includes(difference)) addedOrRemoved = "removed";
				else addedOrRemoved = "added";

				if(oldDif.length)embed.addField(`Roles ${addedOrRemoved}: `, `<@&${difference}>`,false);
				size++;
			}
		if(size)log.send(embed);
		}
					
					
	}catch (err) {console.log(err);}

}