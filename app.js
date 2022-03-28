// Забить хер на реструктуризацию. Написать комментарии
// При переходе из других каналов в создание, он не работает
// Разобраться с созданием канала и его ветвлением

const { Client, Intents, MessageEmbed, MessageActionRow, MessageButton, Message, VoiceChannel, Collection} = require('discord.js');
const mongoose = require('mongoose')
const client = new Client({ intents: [
    Intents.FLAGS.GUILDS, 
    Intents.FLAGS.GUILD_MEMBERS, 
    Intents.FLAGS.GUILD_MESSAGES, 
    Intents.FLAGS.GUILD_VOICE_STATES
]});
const voiceCollection = new Collection()

// Подключени к БД
const mongodbURI = ''
mongoose.connect(mongodbURI).then(() => {
    console.log('Connected to Database!')
}).catch((err) => {
    console.log(err)
})

// Создаём модели
const channelSchema = mongoose.Schema({ // Модель перманентных каналов
    name: String,
    id: String
})

const userSchema = mongoose.Schema({ // Модель пользователя
    username: String,
    discordTag: String,
    discordId: String,
    donateRoles: {
        type: Number,
        default: 0
    },
    wallet: {
        type: Number,
        default: 0
    },
    level: {
        type: Number,
        default: 1
    },
    expPoints: {
        type: Number,
        default: 0
    },
    activeVoiceChannel: {
        type: String,
        default: 0
    },
    isPrivateChannel: {
        type: Boolean,
        default: false
    },
    isCreator: {
        type: Boolean,
        default: false
    },
    idRolePermissions: {
        type: String,
        default: ""
    }
})

const userModel = mongoose.model('userModel', userSchema, 'users')
const constChannel = mongoose.model('channelSchema', channelSchema, 'channels') 


client.once('ready', (ctx) =>{ // Основные Embeds
    console.log("We are online!")
    const manageChannel = client.channels.cache.get('950062642544918568')
    const row1 = new MessageActionRow()
        .addComponents(
            new MessageButton()
                .setCustomId('changeRoomName')
                .setEmoji('950071090577805472')
                .setStyle('SECONDARY')
        )   
        .addComponents(
            new MessageButton()
                .setCustomId('setLimits')
                .setEmoji('950071504912154704')
                .setStyle('SECONDARY')
        )
        .addComponents(
            new MessageButton()
                .setCustomId('closeRoom')
                .setEmoji('950071104997830656')
                .setStyle('SECONDARY')
        )
        .addComponents(
            new MessageButton()
                .setCustomId('openRoom')
                .setEmoji('950071474478280704')
                .setStyle('SECONDARY')
        )
    
    const row2 = new MessageActionRow()
        .addComponents(
            new MessageButton()
                .setCustomId('givePermissions')
                .setEmoji('950071118151159838')
                .setStyle('SECONDARY')
        )
        .addComponents(
            new MessageButton()
                .setCustomId('takePermissions')
                .setEmoji('950071069140742204')
                .setStyle('SECONDARY')
        )
        .addComponents(
            new MessageButton()
                .setCustomId('kickUser')
                .setEmoji('950071129148653608')
                .setStyle('SECONDARY')
        )
        .addComponents(
            new MessageButton()
                .setCustomId('giveKing')
                .setEmoji('950071487895851008')
                .setStyle('SECONDARY')
        )
    manageChannel.send({content: "Hello", components: [row1, row2]})
})

const filter = (m) => { // Фильтр для изменения названия комнаты
    if(m.author.id !== "947198826689736854"){
        return true
    }
    else{
        return false
    }
}

client.on('interactionCreate', async (interaction) => { // Отлавливаем Interaction по кнопкам
    console.log(interaction)
    if(interaction.isButton()){
        const manageChannel = client.channels.cache.get('950062642544918568')
        const user = client.users.cache.get(interaction.user.id)
        if(interaction.customId == "changeRoomName"){
            console.log(interaction)
            await interaction.reply({content: "Введите новое название канала", ephemeral: true, fetchReply: true})
            const collector = manageChannel.createMessageCollector({
                filter,
                max: 1,
                time: 50000
            })
            
            collector.on('collect', msg => {
                let message = msg.content
                msg.delete()
                userModel.find({discordId: interaction.user.id}, (err, results) => {
                    if(!err)
                    if(results[0].isPrivateChannel == true && results[0].isCreator == true){
                        let channel = interaction.guild.channels.resolve(results[0].activeVoiceChannel)
                        channel.setName(message)
                    }
                })
            })
        }
        else if(interaction.customId == "setLimits"){
            await interaction.reply({content: "Ввведите лимит пользователей для вашего канала", ephemeral: true, fetchReply: true})
            const collector = manageChannel.createMessageCollector({
                filter,
                max: 1,
                time: 50000
            })
            collector.on('collect', msg => {
                let message = msg.content
                msg.delete()
                userModel.find({discordId: interaction.user.id}, (err, results) => {
                    if(!err)
                    if(results[0].isPrivateChannel == true && results[0].isCreator == true){
                        let channel = interaction.guild.channels.resolve(results[0].activeVoiceChannel)
                        if(!isNaN(Number(message))){
                            channel.setUserLimit(Number(message))
                        }
                        else{
                            user.send("Вы ввели не число, повторите попытку и введите число") // DM Message
                        }
                    }
                })
            })
        }
        else if(interaction.customId == "closeRoom"){
            await interaction.reply({content: "Вы закрыли канал от других пользователей", ephemeral: true, fetchReply: true})
            userModel.find({discordId: interaction.user.id}, (err, results) => {
                if(!err)
                if(results[0].isPrivateChannel == true && results[0].isCreator == true){
                    let voiceChannel = client.channels.cache.get(results[0].activeVoiceChannel)
                    let everyoneId = "881917181162557471"
                    voiceChannel.permissionOverwrites.edit(everyoneId,  {
                        CONNECT: false
                    })
                }
            })
        }
        else if(interaction.customId == "openRoom"){
            await interaction.reply({content: "Вы открыли канал для других пользователей", ephemeral: true, fetchReply: true})
            userModel.find({discordId: interaction.user.id}, (err, results) => {
                if(!err)
                if(results[0].isPrivateChannel == true && results[0].isCreator == true){
                    let voiceChannel = client.channels.cache.get(results[0].activeVoiceChannel)
                    let everyoneId = "881917181162557471"
                    voiceChannel.permissionOverwrites.edit(everyoneId,  {
                        CONNECT: true
                    })
                }
            })
        }
        else if(interaction.customId == "givePermissions"){
                await interaction.reply({content: "Введите кому вы хотите выдать права для входа", ephemeral: true, fetchReply: true})
                const collector = manageChannel.createMessageCollector({
                    filter,
                    max: 1,
                    time: 50000
                })
                
                collector.on('collect', msg => { // Если вызвать функцию два раза подряд программа ломается
                    let message = msg.content
                    msg.delete()    
                    userModel.find({discordId: interaction.user.id}, (err, results) => {
                        if(!err){}
                        if(results[0].isCreator == true && results[0].isPrivateChannel == true){
                            message = message.replace("<@!", "")
                            message = message.replace(">", "")
                            let user = interaction.guild.members.cache.get(message)
                            let accessRoomRole = interaction.guild.roles.cache.find(role => role.id === results[0].idRolePermissions)
                            user.roles.add(accessRoomRole)
                        }
                    })
                })
            }
        else if(interaction.customId == "takePermissions"){
            await interaction.reply({content: "Введите у кого вы хотите забрать права для входа", ephemeral: true, fetchReply: true})
            const collector = manageChannel.createMessageCollector({
                filter,
                max: 1,
                time: 50000
            })
            
            collector.on('collect', msg => {
                let message = msg.content
                msg.delete()    
                userModel.find({discordId: interaction.user.id}, (err, results) => {
                    if(!err){}
                    if(results[0].isCreator == true && results[0].isPrivateChannel == true){
                        message = message.replace("<@!", "")
                        message = message.replace(">", "")
                        let user = interaction.guild.members.cache.get(message)
                        let accessRoomRole = interaction.guild.roles.cache.find(role => role.id === results[0].idRolePermissions)
                        user.roles.remove(accessRoomRole)
                    }
                })
            })
        }
    }
})


client.on("guildMemberAdd", async newMember => { // Регистрация в системе
    console.log('newMember')
    const username = newMember.user.username
    const welcomeChannel = client.channels.cache.get('947214541039734814')
    let endpoint = newMember.guild.roles.cache.find(role => role.id === "947215952615964745");
    let user = newMember.guild.members.cache.get(newMember.user.id);
    user.roles.add(endpoint)

    const newUser = new userModel({
        username: username,
        discordTag: newMember.tag,
        discordId: newMember.id
    })

    userModel.find({
        discordId: newMember.id.toString()
    }, (err, results) => {
        if (err){
            console.log('Error')
        }
        else if(!results){
            console.log('Save user to db')
            newUser.save()
        }
        else if(results){
            console.log('Find!')
        }
    })

    const welcomeMessage = new MessageEmbed()
        .setColor('#5142FF')
        .setTitle('Добро пожаловать на Triangle')
        .setDescription(`Привет, ${username}. \nТеперь ты часть нашей сети. Надеюсь тебе тут понравится \nДавай, скорее общаться!`)
        .setImage('https://i.imgur.com/hOoqWDU.png')
    await welcomeChannel.send({embeds: [welcomeMessage]})
})

client.on("voiceStateUpdate", async (oldState, newState) => { // Создание приватной комнаты
    // Добавить проверку на переход из команты и удаление
    // Переписать функцию! Ветвления полная хуета!!!!
    const user = await client.users.fetch(newState.id)
    const member = newState.member;
    if(newState.channel != null && oldState.members == undefined  && oldState.channelId !== null && oldState.channelId !== "950073771392385116"){ // Проверка на переход из одной комнату в другую
        console.log('193')
        constChannel.find({id: oldState.channelId.toString()}, (err, results) => { // Запрос к бд
            if(err){
                console.log('I will back in the morning')
            }
            if(!results.length){
                console.log('Delete empty channel')
                oldState.channel.delete();
            }
        })
        constChannel.find({id: newState.channel.id.toString()}, (err, results) => {
            if(err){
                console.log(err)
            }
            if(!results.length){
                userModel.find({discordId: user.id.toString()}, (err, res) => {
                    oldState.guild.roles.delete(res[0].idRolePermissions)
                })
                userModel.updateOne({discordId: user.id.toString()}, {$set: {
                    activeVoiceChannel: newState.channel.id.toString(), 
                    isPrivateChannel: true,
                    isCreator: false
                }}, (err, results) => {
                    console.log(results)
                })
            }
            else{
                userModel.find({discordId: user.id.toString()}, (err, res) => {
                    oldState.guild.roles.delete(res[0].idRolePermissions)
                })
                userModel.updateOne({discordId: user.id.toString()}, {$set: {
                    activeVoiceChannel: newState.channel.id.toString(), 
                    isPrivateChannel: false,
                    isCreator: false
                }}, (err, results) => {
                    console.log(results)
                })
            }
        })
    }
    else if(newState.channel !== null && oldState.channelId !== "950073771392385116"){ // Проверка на переход в другой канал
        console.log('222')
        if(newState.channel.id == "950073771392385116"){ // Заход в создание приватного канала
            const channel = await newState.guild.channels.create(user.tag, {
                type: 'GUILD_VOICE',
                parent: newState.channel.parent
            })
            member.voice.setChannel(channel)
            voiceCollection.set(user.id, channel.id);
            console.log(user.id)
            userModel.updateOne({ discordId: user.id.toString()}, {$set: { // Обнрвление информации в дб по местонахождению user
                activeVoiceChannel: channel.id.toString(), 
                isPrivateChannel: true,
                isCreator: true
            }}, (err, results) => {
                console.log(results)
            })
            // Создаём роль
            let roleName = "🔑" + channel.id.toString()
            newState.guild.roles.create({
                name: roleName,
                color: "GREY"
            }).then(role => {
                member.roles.add(role.id)
                userModel.updateOne({ discordId: user.id.toString()}, {$set: { // Обнрвление информации в дб по местонахождению user
                    idRolePermissions: role.id.toString()
                }}, (err, results) => {
                    console.log(err)
                })
                let privateVC = client.channels.cache.get(channel.id)
                privateVC.permissionOverwrites.edit(role.id,  {
                    CONNECT: true
                })
            })
        }
        else{ // Заход в любой другой канал
            constChannel.find({id: newState.channel.id.toString()}, (err, results) => { // Проверяем к какой категории принадлежит голосовой канал
                if(err){ // Кидаем ошибку 
                    console.log('Error newState ChannelId to String 211')
                }
                if(!results.length){ 
                    /*
                    Если не нашли канал в коллекции channels значит он приватный, задаём этот параметр пользователю в бд
                    */
                    userModel.updateOne({discordId: user.id.toString()}, {$set: {
                        activeVoiceChannel: newState.channel.id.toString(),
                        isPrivateChannel: true,
                        isCreator: false
                    }}, (err, results) => {
                        console.log(results)
                    })
                }
                else if(results.length){
                    /*
                    Если нашли канал в коллекции channels значит он не приватный, задаём этот параметр пользователю в бд
                    */
                    userModel.updateOne({discordId: user.id.toString()}, {$set: {
                        activeVoiceChannel: newState.channel.id.toString(),
                        isPrivateChannel: false,
                        isCreator: false
                    }}, (err, results) => {
                        console.log(results)
                    })
                }
            })
        }
    }
    else{
        console.log('263')
        if(oldState.members == undefined  && oldState.channelId !== null && oldState.channelId !== "950073771392385116"){
            if(newState.channelId !== null){
                constChannel.find({id: newState.channelId.toString()}, (err, results) => {
                    console.log('Find user!1')
                    if(err){console.log(err)}
                    if(results.length){
                        userModel.updateOne({discordId: user.id.toString()}, {$set: {
                            isPrivateChannel: false,
                            isCreator: false
                        }}, (err, results) => {
                            console.log(results)
                        })
                    }
                    else{
                        userModel.updateOne({discordId: user.id.toString()}, {$set: {
                            isPrivateChannel: true
                        }}, (err, results) => {
                            console.log(results)
                        })
                    }
                })
                userModel.updateOne({discordId: user.id.toString()}, {$set:{
                    activeVoiceChannel: newState.channelId.toString()
                }}, (err, results) => {
                    console.log(results)
                })
            }
            else{
                console.log("333")
                constChannel.find({id: oldState.channelId.toString()}, (err, results) => {
                    if(err){
                        console.log('I will back in the morning')
                    }
                    if(!results.length){
                        userModel.find({discordId: user.id.toString()}, (err, res) => {
                            console.log('dfdsf')
                            console.log(res[0])
                            oldState.guild.roles.delete(res[0].idRolePermissions)
                        })
                        userModel.updateOne({discordId: user.id.toString()}, {$set: {
                            activeVoiceChannel: "",
                            isPrivateChannel: false,
                            isCreator: false,
                            idRolePermissions: ""
                        }}, (err, results) => {
                            console.log(results)
                        })
                        console.log('Hi')
                        oldState.channel.delete();
                    }
                })
            }
        }
        else{
            // Обычный переход в новый канал
        }
    }
})

client.login('')
