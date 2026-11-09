const fs = require('fs');
const path = require('path');
const {
    Client,
    GatewayIntentBits,
    REST,
    Routes,
    Events,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    StringSelectMenuBuilder,
    EmbedBuilder,
    Collection,
    SlashCommandBuilder
} = require('discord.js');
const {
    joinVoiceChannel,
    createAudioPlayer,
    createAudioResource,
    AudioPlayerStatus,
    StreamType,
    VoiceConnectionStatus,
    entersState
} = require('@discordjs/voice');
const { spawn } = require('child_process');
const ffmpegPath = require('ffmpeg-static');
const http = require('http');
const icons = {
    Prev: '1535259866631901227',
    Play: '1535258802902011914',
    Pause: '1535259373276762193',
    Next: '1535259864597528657',
    Exit: '1535259907560046632',
    VolDown: '🔉',
    Mute: '🔇',
    VolUp: '🔊',
    Speaker: '🔈',
    Autoplay: '📻'
};

// --- CONFIGURATION ---
const TOKEN = "MTUzNTI0MzE3Nzc4OTg4MjM4OA.GCH5Uu.ccgzGVnDfLIZTOtdalF2ERXck-aJkUrAyUJ6Ok";
const CLIENT_ID = "1535243177789882388";
const DEFAULT_VOLUME = 1.0;

const FILTERS = {
    'none': '',
    'bass': 'bass=g=15,volume=0.5',
    'nightcore': 'atempo=1.06,asetrate=48000*1.25',
    'vaporwave': 'atempo=0.8,asetrate=48000*0.8',
    'earrape': 'volume=10'
};

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates, GatewayIntentBits.GuildMembers]
});

// --- STATE MANAGEMENT ---
let state = {
    connection: null,
    player: createAudioPlayer(),
    currentQuery: null,
    queue: [],
    history: [],
    isPaused: false,
    nowPlayingMessage: null,
    lastInteraction: null,
    autoplay: false,
    loopMode: 0,
    isRestarting: false,
    volume: DEFAULT_VOLUME,
    previousVolume: DEFAULT_VOLUME,
    filterKey: 'none',
    processes: {
        ytdlp: null,
        ffmpeg: null
    },
    searchResults: new Map()
};

// --- COMMAND DEFINITIONS ---
const commandsData = [
    new SlashCommandBuilder().setName('youtube').setDescription('Play music from YouTube').addStringOption(opt => opt.setName('input').setDescription('Link or song name').setRequired(true)),
    new SlashCommandBuilder().setName('soundcloud').setDescription('Play music from SoundCloud (URL or Search)').addStringOption(opt => opt.setName('input').setDescription('Link or song name').setRequired(true)),
    new SlashCommandBuilder().setName('join').setDescription('Join VC 24/7'),
    new SlashCommandBuilder().setName('leave').setDescription('Force leave'),
    new SlashCommandBuilder().setName('reset').setDescription('Reset everything'),
    new SlashCommandBuilder().setName('filter').setDescription('Apply audio filters').addStringOption(opt => opt.setName('type').setDescription('Filter type').setRequired(true).addChoices({ name: 'Bassboost', value: 'bass' }, { name: 'Nightcore', value: 'nightcore' }, { name: 'Vaporwave', value: 'vaporwave' }, { name: 'Off (Reset)', value: 'none' })),
    new SlashCommandBuilder().setName('volume').setDescription('Set volume (0-200)').addIntegerOption(opt => opt.setName('percent').setDescription('Percentage').setRequired(true)),
    new SlashCommandBuilder().setName('loop').setDescription('Toggle song loop mode')
];
const commands = commandsData.map(cmd => cmd.toJSON());

// --- CORE FUNCTIONS ---
function searchMusic(query, prefix = 'ytsearch5:') {
    return new Promise((resolve) => {
        const searchProcess = spawn('yt-dlp', ['-j', '--flat-playlist', `${prefix}${query}`]);
        let output = '';
        searchProcess.stdout.on('data', chunk => output += chunk);
        searchProcess.on('close', () => {
            try {
                const results = output.trim().split('\n').filter(Boolean).map(JSON.parse).map(v => ({
                    title: v.title,
                    url: v.url,
                    duration: v.duration_string || 'Unknown',
                    thumbnail: v.thumbnails ? v.thumbnails[v.thumbnails.length - 1].url : null,
                    channel: v.uploader || 'Unknown'
                }));
                resolve(results);
            } catch (e) {
                resolve([]);
            }
        });
    });
}

function fetchAutoplaySong(url) {
    return new Promise((resolve) => {
        const match = url.match(/[?&]v=([^&]+)/) || url.match(/youtu\.be\/([^?]+)/);
        if (!match) return resolve(null);
        const videoId = match[1];

        const searchProcess = spawn('yt-dlp', ['-j', '--flat-playlist', '--playlist-items', '2', `https://www.youtube.com/watch?v=${videoId}&list=RD${videoId}`]);
        let output = '';
        searchProcess.stdout.on('data', chunk => output += chunk);
        searchProcess.on('close', () => {
            try {
                const v = JSON.parse(output.trim());
                resolve({
                    title: v.title,
                    url: v.url || `https://www.youtube.com/watch?v=${v.id}`,
                    duration: v.duration_string || 'Unknown',
                    thumbnail: v.thumbnails ? v.thumbnails[v.thumbnails.length - 1].url : null,
                    channel: v.uploader || 'Unknown'
                });
            } catch (e) {
                resolve(null);
            }
        });
    });
}

function getNowPlayingPayload() {
    const song = state.currentQuery;
    if (!song) return null;
    
    const embed = new EmbedBuilder()
        .setColor(state.isPaused ? 0xFFA500 : 0x0099FF)
        .setTitle(state.isPaused ? '⏸ Paused' : '🎶 Now Playing')
        .setDescription(`**[${song.title}](${song.url})**`)
        .addFields(
            { name: 'Channel', value: song.channel, inline: true },
            { name: 'Duration', value: song.duration, inline: true },
            { name: 'Queue', value: `${state.queue.length} songs`, inline: true }
        );
    if (song.thumbnail) embed.setThumbnail(song.thumbnail);

    const buttonRow1 = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('btn_prev').setEmoji(icons.Prev).setStyle(ButtonStyle.Secondary).setDisabled(state.history.length === 0),
        new ButtonBuilder().setCustomId('btn_playpause').setEmoji(state.isPaused ? icons.Play : icons.Pause).setStyle(state.isPaused ? ButtonStyle.Success : ButtonStyle.Primary),
        new ButtonBuilder().setCustomId('btn_skip').setEmoji(icons.Next).setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('btn_autoplay').setEmoji(icons.Autoplay).setStyle(state.autoplay ? ButtonStyle.Success : ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('btn_exit').setEmoji(icons.Exit).setStyle(ButtonStyle.Danger)
    );

    const volumeRow = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
            .setCustomId('select_volume')
            .setPlaceholder(`🔊 Volume: ${state.volume * 100}%`)
            .addOptions([
                { label: '0% (Mute)', value: '0' },
                { label: '25%', value: '0.25' },
                { label: '50%', value: '0.5' },
                { label: '75%', value: '0.75' },
                { label: '100% (Default)', value: '1.0' },
                { label: '150% (Boost)', value: '1.5' },
                { label: '200% (Max)', value: '2.0' }
            ])
    );

    const filterRow = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
            .setCustomId('select_filter')
            .setPlaceholder(`Filter: ${state.filterKey}`)
            .addOptions([
                { label: 'None (Default)', value: 'none' },
                { label: 'Bassboost', value: 'bass' },
                { label: 'Nightcore', value: 'nightcore' },
                { label: 'Vaporwave', value: 'vaporwave' },
                { label: 'Earrape', value: 'earrape' },
            ])
    );

    return { embeds: [embed], components: [buttonRow1, volumeRow, filterRow] };
}

async function playNext() {
    if (!state.isRestarting && state.currentQuery) {
        if (state.loopMode === 1) {
            state.queue.unshift(state.currentQuery);
        } else if (state.loopMode === 2) {
            state.queue.push(state.currentQuery);
            state.history.push(state.currentQuery);
            if (state.history.length > 20) state.history.shift();
        } else {
            state.history.push(state.currentQuery);
            if (state.history.length > 20) state.history.shift();
        }
    }
    state.isRestarting = false;

    if (state.queue.length === 0) {
        if (state.autoplay && state.currentQuery) {
            if (state.nowPlayingMessage) {
                const embed = EmbedBuilder.from(state.nowPlayingMessage.embeds[0]).setTitle('📻 Fetching Autoplay...');
                await state.nowPlayingMessage.edit({ embeds: [embed] }).catch(() => {});
            }
            const nextSong = await fetchAutoplaySong(state.currentQuery.url);
            if (nextSong) state.queue.push(nextSong);
        }

        if (state.queue.length === 0) {
            if (state.nowPlayingMessage) {
                await state.nowPlayingMessage.edit({ components: [] }).catch(() => {});
                state.nowPlayingMessage = null;
            }
            return;
        }
    }

    if (state.processes.ytdlp) state.processes.ytdlp.kill();
    if (state.processes.ffmpeg) state.processes.ffmpeg.kill();

    const song = state.queue.shift();
    state.currentQuery = song;

    const ytdlp = spawn('yt-dlp', [
        '-o', '-', '-f', 'bestaudio', '--buffer-size', '16M', '--no-playlist', song.url
    ]);
    state.processes.ytdlp = ytdlp;

    const ffmpegArgs = [
        '-i', 'pipe:0',
        '-c:a', 'libopus',
        '-b:a', '192k',
        '-f', 'webm',
        '-ar', '48000',
        '-ac', '2',
        '-vn',
        '-loglevel', '0'
    ];

    let filterString = FILTERS[state.filterKey] || '';
    if (state.volume !== 1.0) {
        const volFilter = `volume=${state.volume}`;
        filterString = filterString ? `${filterString},${volFilter}` : volFilter;
    }
    
    if (filterString) ffmpegArgs.push('-af', filterString);
    ffmpegArgs.push('pipe:1');

    const ffmpeg = spawn(ffmpegPath, ffmpegArgs);
    state.processes.ffmpeg = ffmpeg;

    ffmpeg.stdin.on('error', (err) => {
        if (err.code === 'EPIPE') return;
        console.error('FFmpeg Stdin Error:', err);
    });

    ytdlp.stdout.pipe(ffmpeg.stdin);

    const resource = createAudioResource(ffmpeg.stdout, {
        inputType: StreamType.WebmOpus,
        inlineVolume: false
    });

    state.player.play(resource);
    state.isPaused = false;

    try {
        if (state.nowPlayingMessage) await state.nowPlayingMessage.delete().catch(() => {});
        if (state.lastInteraction?.channel) {
            state.nowPlayingMessage = await state.lastInteraction.channel.send(getNowPlayingPayload());
        }
    } catch (e) { console.error(e); }
}

// Play Next when current song finishes
state.player.on(AudioPlayerStatus.Idle, () => {
    playNext();
});

// --- INTERACTION HANDLING ---
client.on('interactionCreate', async interaction => {
    if (interaction.isButton()) {
        if (!state.currentQuery) return interaction.reply({ content: "Nothing is playing.", ephemeral: true });
        
        if (interaction.customId === 'btn_prev') {
            if (state.history.length > 0) {
                const prev = state.history.pop();
                if (state.currentQuery) state.queue.unshift(state.currentQuery); // Push current back to queue
                state.queue.unshift(prev); // Push prev as next up
                state.isRestarting = true;
                state.player.stop(); // Triggers Idle -> playNext
            }
            await interaction.deferUpdate().catch(() => {});
        }
        
        if (interaction.customId === 'btn_playpause') {
            if (state.isPaused) {
                state.player.unpause();
                state.isPaused = false;
            } else {
                state.player.pause();
                state.isPaused = true;
            }
            await interaction.update(getNowPlayingPayload()).catch(() => {});
        }
        if (interaction.customId === 'btn_skip') {
            state.player.stop(); // Triggers Idle -> playNext
            await interaction.deferUpdate().catch(() => {});
        }
        if (interaction.customId === 'btn_exit') {
            state.queue = [];
            state.history = [];
            state.player.stop();
            if (state.connection) {
                state.connection.destroy();
                state.connection = null;
            }
            await interaction.update({ content: "🚪 Left the voice channel.", embeds: [], components: [] }).catch(() => {});
            state.nowPlayingMessage = null;
        }

        if (interaction.customId === 'btn_autoplay') {
            state.autoplay = !state.autoplay;
            await interaction.update(getNowPlayingPayload()).catch(() => {});
        }
        return;
    }

    if (interaction.isStringSelectMenu()) {
        if (interaction.customId === 'select_volume') {
            state.volume = parseFloat(interaction.values[0]);
            if (state.currentQuery) {
                state.queue.unshift(state.currentQuery);
                state.isRestarting = true;
                state.player.stop(); // Trigger playNext to apply volume via FFmpeg instantly
            }
            await interaction.deferUpdate().catch(() => {});
            return;
        }
        if (interaction.customId === 'select_filter') {
            state.filterKey = interaction.values[0];
            if (state.currentQuery) {
                state.queue.unshift(state.currentQuery);
                state.player.stop(); // Trigger playNext to restart with new filter
            }
            await interaction.deferUpdate().catch(() => {});
            return;
        }

        if (interaction.customId.startsWith('search_select_')) {
            const id = interaction.customId.replace('search_select_', '');
            const results = state.searchResults.get(id);
            if (!results) return interaction.update({ content: 'Search session expired.', components: [] }).catch(() => {});

            const song = results[parseInt(interaction.values[0])];
            state.queue.push(song);
            
            if (state.player.state.status === AudioPlayerStatus.Idle) {
                await interaction.update({ content: `🎵 Starting playback: **${song.title}**`, components: [] }).catch(() => {});
                playNext();
            } else {
                await interaction.update({ content: `✅ Added to queue: **${song.title}**`, components: [] }).catch(() => {});
            }
            state.searchResults.delete(id);
        }
        return;
    }

    if (!interaction.isChatInputCommand()) return;
    state.lastInteraction = interaction;

    
    try {
        if (['youtube', 'soundcloud', 'join', 'filter', 'reset'].includes(interaction.commandName)) {
            let member = interaction.member;
            if (interaction.guild) {
                member = await interaction.guild.members.fetch(interaction.user.id).catch(() => member);
            }
            if (!member?.voice?.channel) {
                return interaction.reply({ content: `You need to join a voice channel first!`, ephemeral: true });
            }

            if (!state.connection) {
                state.connection = joinVoiceChannel({
                    channelId: member.voice.channel.id,
                    guildId: interaction.guildId,
                    adapterCreator: interaction.guild.voiceAdapterCreator,
                });
                state.connection.subscribe(state.player);

                state.connection.on(VoiceConnectionStatus.Disconnected, async () => {
                    try {
                        await Promise.race([
                            entersState(state.connection, VoiceConnectionStatus.Signalling, 5_000),
                            entersState(state.connection, VoiceConnectionStatus.Connecting, 5_000),
                        ]);
                    } catch (error) {
                        state.connection.destroy();
                        state.connection = null;
                    }
                });
            }
        }
        
        if (interaction.commandName === 'youtube') {
            const input = interaction.options.getString('input');
            await interaction.deferReply();
            let results;
            if (input.startsWith('http')) {
                results = await searchMusic(input, '');
            } else {
                results = await searchMusic(input);
            }

            if (!results.length) return interaction.editReply("No results found.");

            state.searchResults.set(interaction.id, results);
            const select = new StringSelectMenuBuilder()
                .setCustomId(`search_select_${interaction.id}`)
                .setPlaceholder('Select a song to play')
                .addOptions(results.slice(0, 5).map((song, i) => ({
                    label: song.title.substring(0, 100),
                    description: `Duration: ${song.duration} | Channel: ${song.channel}`.substring(0, 100),
                    value: i.toString()
                })));

            const row = new ActionRowBuilder().addComponents(select);
            await interaction.editReply({ content: '🔍 **Search Results:**', components: [row] });
        } else if (interaction.commandName === 'soundcloud') {
            const input = interaction.options.getString('input');
            await interaction.deferReply();

            if (input.startsWith('http')) {
                const song = { title: input, url: input, duration: 'Unknown', channel: 'Unknown', thumbnail: null };
                state.queue.push(song);
                if (state.player.state.status === AudioPlayerStatus.Idle) {
                    playNext();
                    interaction.editReply(`Playing URL: **${input}**`);
                } else {
                    interaction.editReply(`Added to queue: **${input}**`);
                }
            } else {
                const apiResults = await scSearch(input, 5);
                if (!apiResults.length) return interaction.editReply("No results found on SoundCloud.");

                const results = apiResults.map(track => ({
                    title: track.title,
                    url: track.permalink_url,
                    duration: track.duration ? formatDuration(track.duration) : 'Unknown',
                    channel: track.user?.username || 'Unknown',
                    thumbnail: track.artwork_url || null
                }));

                state.searchResults.set(interaction.id, results);

                const select = new StringSelectMenuBuilder()
                    .setCustomId(`search_select_${interaction.id}`)
                    .setPlaceholder('Select a song to play')
                    .addOptions(results.map((song, i) => ({
                        label: song.title.substring(0, 100),
                        description: `Duration: ${song.duration} | Channel: ${song.channel}`.substring(0, 100),
                        value: i.toString()
                    })));

                const row = new ActionRowBuilder().addComponents(select);
                await interaction.editReply({ content: '🔍 **SoundCloud Results:**', components: [row] });
            }
        } else if (interaction.commandName === 'join') {
            await interaction.reply("✅ Joined the channel! 24/7 mode enabled.");
        } else if (interaction.commandName === 'leave') {
            if (!state.connection) return interaction.reply({ content: "I'm not in a voice channel.", ephemeral: true });
            state.queue = [];
            state.history = [];
            state.player.stop();
            state.connection.destroy();
            state.connection = null;
            if (state.nowPlayingMessage) {
                await state.nowPlayingMessage.delete().catch(() => {});
                state.nowPlayingMessage = null;
            }
            await interaction.reply({ content: "🚪 Disconnected." });
        } else if (interaction.commandName === 'reset') {
            if (state.processes.ytdlp) state.processes.ytdlp.kill();
            if (state.processes.ffmpeg) state.processes.ffmpeg.kill();
            state.queue = [];
            state.history = [];
            state.player.stop();
            if (state.nowPlayingMessage) {
                await state.nowPlayingMessage.delete().catch(() => {});
                state.nowPlayingMessage = null;
            }
            await interaction.reply("♻️ System fully reset!");
        } else if (interaction.commandName === 'filter') {
            const type = interaction.options.getString('type');
            state.filterKey = type;
            if (state.currentQuery) {
                state.queue.unshift(state.currentQuery);
                state.isRestarting = true;
                state.player.stop();
            }
            await interaction.reply(`Filter set to: **${state.filterKey}**`);
        } else if (interaction.commandName === 'volume') {
            const volPercent = interaction.options.getInteger('percent');
            const vol = volPercent / 100;
            state.volume = vol;
            if (state.currentQuery) {
                state.queue.unshift(state.currentQuery);
                state.player.stop(); // Restart stream to apply volume instantly via FFmpeg
            }
            await interaction.reply(`🔊 Volume set to: **${volPercent}%**`);
        } else if (interaction.commandName === 'loop') {
            state.loopMode = (state.loopMode + 1) % 3;
            let loopText = 'OFF';
            if (state.loopMode === 1) loopText = 'TRACK';
            if (state.loopMode === 2) loopText = 'QUEUE';
            await interaction.reply(`🔁 Loop mode set to: **${loopText}**`);
        }

    } catch (error) {
        console.error(error);
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({ content: 'There was an error executing this command!', ephemeral: true });
        } else {
            await interaction.reply({ content: 'There was an error executing this command!', ephemeral: true });
        }
    }
});

// --- WELCOME MESSAGE ---
client.on(Events.GuildMemberAdd, async member => {
    try {
        const welcomeChannel = member.guild.channels.cache.find(ch => ch.name === 'welcome') || member.guild.systemChannel;
        if (!welcomeChannel) return;

        const welcomeEmbed = new EmbedBuilder()
            .setColor(0x0099FF)
            .setTitle(`🎉 Welcome to ${member.guild.name}!`)
            .setDescription(`Hello <@${member.id}>, welcome to the server! We're glad to have you here.`)
            .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 256 }))
            .addFields(
                { name: 'Member Count', value: `You are member #${member.guild.memberCount}`, inline: true }
            )
            .setFooter({ text: 'Enjoy your stay!' })
            .setTimestamp();

        await welcomeChannel.send({ embeds: [welcomeEmbed] });
    } catch (error) {
        console.error('Failed to send welcome message:', error);
    }
});

// --- BOT STARTUP ---
client.once(Events.ClientReady, async () => {
    const rest = new REST({ version: '10' }).setToken(TOKEN);
    try {
        await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });
        console.log('Bot Online & Commands Registered');
    } catch (e) {
        console.error(e);
    }
});

client.login(TOKEN);

// --- HTTP SERVER ---
const server = http.createServer((req, res) => {
    res.writeHead(200);
    res.end('OK');
});

server.listen(8300, '::', () => {
    console.log('Server bound to IPv6 / Port 8300');
});