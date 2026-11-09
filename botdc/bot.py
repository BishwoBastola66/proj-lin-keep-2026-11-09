import os
import asyncio
import logging

import discord
from discord.ext import commands
from discord import app_commands
import yt_dlp


# ============================================================
# LOGGING
# ============================================================

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(message)s"
)


# ============================================================
# CONFIGURATION
# ============================================================

TOKEN = "MTUzNTI0MzE3Nzc4OTg4MjM4OA.GCH5Uu.ccgzGVnDfLIZTOtdalF2ERXck-aJkUrAyUJ6Ok"

if not TOKEN:
    raise RuntimeError(
        "DISCORD_TOKEN environment variable is not set."
    )


# ============================================================
# ICONS
# ============================================================

icons = {
    "Prev": "1535259866631901227",
    "Play": "1535258802902011914",
    "Pause": "1535259373276762193",
    "Next": "1535259864597528657",
    "Exit": "1535259907560046632",
    "VolDown": "🔉",
    "Mute": "🔇",
    "VolUp": "🔊",
    "Speaker": "🔈",
    "Autoplay": "📻",
}


# ============================================================
# GUILD STATE
# ============================================================

class GuildState:
    def __init__(self):
        self.queue = []
        self.history = []
        self.current_song = None

        self.is_paused = False

        self.now_playing_msg = None
        self.text_channel = None

        self.autoplay = False

        # 0 = Off
        # 1 = Track
        # 2 = Queue
        self.loop_mode = 0

        # Used for filtered playback.
        # Normal playback uses native Opus passthrough.
        self.volume = 1.0

        self.filter_key = "none"


guild_states = {}


def get_state(guild_id: int) -> GuildState:
    if guild_id not in guild_states:
        guild_states[guild_id] = GuildState()

    return guild_states[guild_id]


# ============================================================
# BOT
# ============================================================

class MyBot(commands.Bot):

    def __init__(self):
        intents = discord.Intents.default()
        intents.message_content = True

        super().__init__(
            command_prefix="!",
            intents=intents
        )

    async def setup_hook(self):
        await self.tree.sync()

        logging.info(
            "Bot Online & Commands Registered"
        )


bot = MyBot()


@bot.event
async def on_ready():

    logging.info(
        f"Logged in as {bot.user} "
        f"(ID: {bot.user.id})"
    )

    synced_count = 0

    for guild in bot.guilds:

        try:
            bot.tree.copy_global_to(guild=guild)

            await bot.tree.sync(
                guild=guild
            )

            synced_count += 1

            logging.info(
                f"Synced commands to guild: {guild.name}"
            )

        except Exception as e:

            logging.error(
                f"Failed to sync {guild.id}: {e}"
            )

    logging.info(
        f"Commands synced to "
        f"{synced_count} servers."
    )


# ============================================================
# YOUTUBE SEARCH
# ============================================================

async def search_youtube(query: str):

    ydl_opts = {
        "quiet": True,
        "no_warnings": True,

        "noplaylist": True,

        # Search only.
        # We extract the actual audio stream later.
        "extract_flat": True,

        "default_search": "ytsearch5",
    }

    def _search():

        with yt_dlp.YoutubeDL(
            ydl_opts
        ) as ydl:

            if query.startswith("http"):

                return ydl.extract_info(
                    query,
                    download=False
                )

            return ydl.extract_info(
                f"ytsearch5:{query}",
                download=False
            )

    loop = asyncio.get_running_loop()

    info = await loop.run_in_executor(
        None,
        _search
    )

    results = []

    if not info:
        return results

    # Search results
    if "entries" in info:

        for entry in info["entries"]:

            if not entry:
                continue

            results.append({
                "title": entry.get(
                    "title",
                    "Unknown Title"
                ),

                "url": entry.get(
                    "webpage_url",
                    entry.get("url")
                ),

                "duration": str(
                    entry.get(
                        "duration",
                        "Unknown"
                    )
                ),

                "channel": entry.get(
                    "uploader",
                    "Unknown"
                ),
            })

    # Direct URL
    else:

        results.append({
            "title": info.get(
                "title",
                "Unknown Title"
            ),

            "url": info.get(
                "webpage_url",
                info.get("url")
            ),

            "duration": str(
                info.get(
                    "duration",
                    "Unknown"
                )
            ),

            "channel": info.get(
                "uploader",
                "Unknown"
            ),
        })

    return results


# ============================================================
# EXTRACT NATIVE AUDIO STREAM
# ============================================================

async def extract_audio_info(song):

    loop = asyncio.get_running_loop()

    def _extract():

        ydl_opts = {
            # ------------------------------------------------
            # Prefer native YouTube Opus.
            #
            # If Opus is unavailable, fall back to the best
            # available audio stream.
            # ------------------------------------------------
            "format": (
                "bestaudio[acodec=opus]/"
                "bestaudio[acodec=vorbis]/"
                "bestaudio"
            ),

            "noplaylist": True,

            "quiet": True,
            "no_warnings": True,

            # Avoid downloading the file.
            "skip_download": True,
        }

        with yt_dlp.YoutubeDL(
            ydl_opts
        ) as ydl:

            return ydl.extract_info(
                song["url"],
                download=False
            )

    return await loop.run_in_executor(
        None,
        _extract
    )


# ============================================================
# PLAYER CONTROLS
# ============================================================

class PlayerControls(discord.ui.View):

    def __init__(self, guild_id: int):

        super().__init__(
            timeout=None
        )

        self.guild_id = guild_id

    async def interaction_check(
        self,
        interaction: discord.Interaction
    ) -> bool:

        if not interaction.guild:
            return False

        if not interaction.user.voice:

            await interaction.response.send_message(
                "You must be in a voice channel!",
                ephemeral=True
            )

            return False

        return True

    # --------------------------------------------------------
    # PREVIOUS
    # --------------------------------------------------------

    @discord.ui.button(
        custom_id="btn_prev",
        emoji="⏮️"
    )
    async def btn_prev(
        self,
        interaction: discord.Interaction,
        button: discord.ui.Button
    ):

        state = get_state(
            self.guild_id
        )

        if state.history:

            prev_song = state.history.pop()

            if state.current_song:

                state.queue.insert(
                    0,
                    state.current_song
                )

            state.queue.insert(
                0,
                prev_song
            )

            vc = interaction.guild.voice_client

            if vc:
                vc.stop()

        await interaction.response.defer()

    # --------------------------------------------------------
    # PLAY / PAUSE
    # --------------------------------------------------------

    @discord.ui.button(
        custom_id="btn_playpause",
        emoji="⏯️"
    )
    async def btn_playpause(
        self,
        interaction: discord.Interaction,
        button: discord.ui.Button
    ):

        vc = interaction.guild.voice_client

        if vc:

            if vc.is_paused():

                vc.resume()

            elif vc.is_playing():

                vc.pause()

        await interaction.response.defer()

    # --------------------------------------------------------
    # SKIP
    # --------------------------------------------------------

    @discord.ui.button(
        custom_id="btn_skip",
        emoji="⏭️"
    )
    async def btn_skip(
        self,
        interaction: discord.Interaction,
        button: discord.ui.Button
    ):

        vc = interaction.guild.voice_client

        if vc:
            vc.stop()

        await interaction.response.defer()

    # --------------------------------------------------------
    # AUTOPLAY
    # --------------------------------------------------------

    @discord.ui.button(
        custom_id="btn_autoplay",
        emoji="📻"
    )
    async def btn_autoplay(
        self,
        interaction: discord.Interaction,
        button: discord.ui.Button
    ):

        state = get_state(
            self.guild_id
        )

        state.autoplay = not state.autoplay

        await interaction.response.send_message(
            f"Autoplay turned "
            f"{'ON' if state.autoplay else 'OFF'}",
            ephemeral=True
        )

    # --------------------------------------------------------
    # EXIT
    # --------------------------------------------------------

    @discord.ui.button(
        custom_id="btn_exit",
        emoji="🚪"
    )
    async def btn_exit(
        self,
        interaction: discord.Interaction,
        button: discord.ui.Button
    ):

        state = get_state(
            self.guild_id
        )

        state.queue.clear()
        state.history.clear()

        vc = interaction.guild.voice_client

        if vc:

            try:
                vc.stop()
            except Exception:
                pass

            await vc.disconnect()

        if state.now_playing_msg:

            try:
                await state.now_playing_msg.delete()

            except Exception:
                pass

            state.now_playing_msg = None

        await interaction.response.send_message(
            "🚪 Left the voice channel."
        )


# ============================================================
# SONG SELECT
# ============================================================

class SongSelect(discord.ui.Select):

    def __init__(
        self,
        results,
        guild_id
    ):

        self.results = results
        self.guild_id = guild_id

        options = []

        for i, res in enumerate(
            results[:5]
        ):

            options.append(
                discord.SelectOption(
                    label=res["title"][:100],

                    description=(
                        f"Duration: "
                        f"{res['duration']} | "
                        f"Channel: "
                        f"{res['channel']}"
                    )[:100],

                    value=str(i)
                )
            )

        super().__init__(
            placeholder="Select a song to play",
            options=options,
            custom_id="song_select"
        )

    async def callback(
        self,
        interaction: discord.Interaction
    ):

        song = self.results[
            int(self.values[0])
        ]

        state = get_state(
            self.guild_id
        )

        state.queue.append(song)

        # Remember text channel.
        state.text_channel = (
            interaction.channel
        )

        vc = interaction.guild.voice_client

        if not vc:

            vc = await (
                interaction.user
                .voice
                .channel
                .connect()
            )

        if (
            not vc.is_playing()
            and not vc.is_paused()
        ):

            await interaction.response.edit_message(
                content=(
                    f"🎵 Starting playback: "
                    f"**{song['title']}**"
                ),
                view=None
            )

            await play_next(
                interaction.guild
            )

        else:

            await interaction.response.edit_message(
                content=(
                    f"✅ Added to queue: "
                    f"**{song['title']}**"
                ),
                view=None
            )


class SearchView(discord.ui.View):

    def __init__(
        self,
        results,
        guild_id
    ):

        super().__init__(
            timeout=120
        )

        self.add_item(
            SongSelect(
                results,
                guild_id
            )
        )


# ============================================================
# PLAY NEXT
# ============================================================

async def play_next(
    guild: discord.Guild
):

    state = get_state(
        guild.id
    )

    vc = guild.voice_client

    if not vc:
        return

    # --------------------------------------------------------
    # Nothing queued
    # --------------------------------------------------------

    if not state.queue:

        # Autoplay
        if (
            state.autoplay
            and state.current_song
        ):

            try:

                results = await search_youtube(
                    f"{state.current_song['title']} mix"
                )

                if len(results) > 1:

                    state.queue.append(
                        results[1]
                    )

            except Exception as e:

                logging.error(
                    f"Autoplay error: {e}"
                )

        # Still nothing
        if not state.queue:

            if state.now_playing_msg:

                try:

                    await state.now_playing_msg.edit(
                        view=None
                    )

                except Exception:
                    pass

                state.now_playing_msg = None

            return

    # --------------------------------------------------------
    # Handle current song
    # --------------------------------------------------------

    if state.current_song:

        # Track loop
        if state.loop_mode == 1:

            state.queue.insert(
                0,
                state.current_song
            )

        # Queue loop
        elif state.loop_mode == 2:

            state.queue.append(
                state.current_song
            )

            state.history.append(
                state.current_song
            )

        # Normal
        else:

            state.history.append(
                state.current_song
            )

        # Limit history
        if len(state.history) > 20:

            state.history.pop(0)

    # --------------------------------------------------------
    # Get next song
    # --------------------------------------------------------

    song = state.queue.pop(0)

    state.current_song = song

    # --------------------------------------------------------
    # Extract stream
    # --------------------------------------------------------

    try:

        info = await extract_audio_info(
            song
        )

        stream_url = info.get("url")

        codec = info.get("acodec")

        container = info.get(
            "container"
        )

        abr = info.get("abr")
        asr = info.get("asr")

        if not stream_url:

            raise RuntimeError(
                "yt-dlp returned no audio URL."
            )

        logging.info(
            "Audio selected | "
            f"title={song['title']} | "
            f"codec={codec} | "
            f"container={container} | "
            f"abr={abr} | "
            f"sample_rate={asr}"
        )

    except Exception as e:

        logging.error(
            f"Audio extraction failed: {e}"
        )

        # Try next queued song.
        await play_next(guild)

        return

    # --------------------------------------------------------
    # FFmpeg reconnect settings
    # --------------------------------------------------------

    before_options = (
        "-reconnect 1 "
        "-reconnect_streamed 1 "
        "-reconnect_delay_max 5"
    )

    # --------------------------------------------------------
    # Audio filters
    # --------------------------------------------------------

    filters = []

    # Volume
    if state.volume != 1.0:

        filters.append(
            f"volume={state.volume}"
        )

    # Bass boost
    if state.filter_key == "bass":

        filters.append(
            "bass=g=15,volume=0.5"
        )

    # Nightcore
    elif state.filter_key == "nightcore":

        filters.append(
            "atempo=1.06,"
            "asetrate=48000*1.25"
        )

    # Vaporwave
    elif state.filter_key == "vaporwave":

        filters.append(
            "atempo=0.8,"
            "asetrate=48000*0.8"
        )

    # Earrape
    elif state.filter_key == "earrape":

        filters.append(
            "volume=10"
        )

    # --------------------------------------------------------
    # AUDIO PLAYBACK SOURCE
    # --------------------------------------------------------
    #
    # We output a clean 48 kHz stereo PCM signal from FFmpeg,
    # and let Discord handle the final Opus encoding.
    # --------------------------------------------------------

    try:

        ffmpeg_options = {
            "before_options": (
                "-reconnect 1 "
                "-reconnect_streamed 1 "
                "-reconnect_delay_max 5"
            ),
            "options": (
                "-vn "
                "-ac 2 "
                "-ar 48000 "
                "-sample_fmt s16"
            )
        }

        if filters:
            ffmpeg_options["options"] += (
                f' -af "{",".join(filters)}"'
            )

        source = discord.FFmpegPCMAudio(
            stream_url,
            **ffmpeg_options
        )

    except Exception as e:

        logging.error(
            f"Failed to create audio source: {e}"
        )

        await play_next(guild)

        return

    # --------------------------------------------------------
    # Playback callback
    # --------------------------------------------------------

    loop = asyncio.get_running_loop()

    def after_playing(error):

        if error:

            logging.error(
                f"Playback error in guild "
                f"{guild.id}: {error}"
            )

        future = asyncio.run_coroutine_threadsafe(
            play_next(guild),
            loop
        )

        try:
            future.result()

        except Exception as callback_error:

            logging.error(
                f"play_next callback error: "
                f"{callback_error}"
            )

    # --------------------------------------------------------
    # Start
    # --------------------------------------------------------

    try:

        vc.play(
            source,
            after=after_playing
        )

    except Exception as e:

        logging.error(
            f"Voice playback failed: {e}"
        )

        await play_next(guild)

        return

    # --------------------------------------------------------
    # Now Playing Embed
    # --------------------------------------------------------

    embed = discord.Embed(
        title="🎶 Now Playing",
        description=song["title"],
        color=0x00FF00
    )

    embed.add_field(
        name="Channel",
        value=song.get(
            "channel",
            "Unknown"
        ),
        inline=True
    )

    embed.add_field(
        name="Duration",
        value=song.get(
            "duration",
            "Unknown"
        ),
        inline=True
    )

    embed.add_field(
        name="Codec",
        value=f"`{codec or 'unknown'}`",
        inline=True
    )

    if codec == "opus" and not filters:

        embed.add_field(
            name="Mode",
            value="🟢 Native Opus",
            inline=True
        )

    else:

        embed.add_field(
            name="Mode",
            value="🔵 FFmpeg Opus",
            inline=True
        )

    view = PlayerControls(
        guild.id
    )

    # Delete previous now-playing message.
    if state.now_playing_msg:

        try:

            await state.now_playing_msg.delete()

        except Exception:
            pass

    # Send new message.
    if state.text_channel:

        try:

            state.now_playing_msg = (
                await state.text_channel.send(
                    embed=embed,
                    view=view
                )
            )

        except Exception as e:

            logging.error(
                f"Failed to send now-playing message: "
                f"{e}"
            )


# ============================================================
# /youtube
# ============================================================

@bot.tree.command(
    name="youtube",
    description="Play music from YouTube"
)
async def cmd_youtube(
    interaction: discord.Interaction,
    input: str
):

    if not interaction.user.voice:

        await interaction.response.send_message(
            "Join a voice channel first!",
            ephemeral=True
        )

        return

    await interaction.response.defer()

    state = get_state(
        interaction.guild_id
    )

    state.text_channel = (
        interaction.channel
    )

    try:

        results = await search_youtube(
            input
        )

    except Exception as e:

        logging.error(
            f"YouTube search error: {e}"
        )

        await interaction.followup.send(
            "❌ YouTube search failed."
        )

        return

    if not results:

        await interaction.followup.send(
            "No results found."
        )

        return

    await interaction.followup.send(
        "🔍 **Search Results:**",
        view=SearchView(
            results,
            interaction.guild_id
        )
    )


# ============================================================
# /join
# ============================================================

@bot.tree.command(
    name="join",
    description="Join VC 24/7"
)
async def cmd_join(
    interaction: discord.Interaction
):

    if not interaction.user.voice:

        await interaction.response.send_message(
            "Join a voice channel first!",
            ephemeral=True
        )

        return

    if interaction.guild.voice_client:

        await interaction.response.send_message(
            "Already connected!",
            ephemeral=True
        )

        return

    await interaction.user.voice.channel.connect()

    state = get_state(
        interaction.guild_id
    )

    state.text_channel = (
        interaction.channel
    )

    await interaction.response.send_message(
        "✅ Joined the channel! "
        "24/7 mode enabled."
    )


# ============================================================
# /leave
# ============================================================

@bot.tree.command(
    name="leave",
    description="Force leave"
)
async def cmd_leave(
    interaction: discord.Interaction
):

    vc = interaction.guild.voice_client

    if vc:

        try:
            vc.stop()
        except Exception:
            pass

        await vc.disconnect()

        state = get_state(
            interaction.guild_id
        )

        state.queue.clear()
        state.history.clear()
        state.current_song = None

        await interaction.response.send_message(
            "🚪 Disconnected."
        )

    else:

        await interaction.response.send_message(
            "Not in a voice channel."
        )


# ============================================================
# /volume
# ============================================================

@bot.tree.command(
    name="volume",
    description="Set volume (0-200)"
)
async def cmd_volume(
    interaction: discord.Interaction,
    percent: int
):

    if percent < 0 or percent > 200:

        await interaction.response.send_message(
            "Volume must be between 0 and 200.",
            ephemeral=True
        )

        return

    state = get_state(
        interaction.guild_id
    )

    state.volume = percent / 100.0

    vc = interaction.guild.voice_client

    # --------------------------------------------------------
    # Volume changes require an FFmpeg filter.
    #
    # Therefore we restart the current track and it will use
    # the filtered/re-encoded path.
    # --------------------------------------------------------

    if vc and state.current_song:

        state.queue.insert(
            0,
            state.current_song
        )

        vc.stop()

    await interaction.response.send_message(
        f"🔊 Volume set to: **{percent}%**"
    )


# ============================================================
# /filter
# ============================================================

@bot.tree.command(
    name="filter",
    description="Apply audio filters"
)
@app_commands.choices(
    type=[
        app_commands.Choice(
            name="Bassboost",
            value="bass"
        ),

        app_commands.Choice(
            name="Nightcore",
            value="nightcore"
        ),

        app_commands.Choice(
            name="Vaporwave",
            value="vaporwave"
        ),

        app_commands.Choice(
            name="Earrape",
            value="earrape"
        ),

        app_commands.Choice(
            name="Off (Reset)",
            value="none"
        ),
    ]
)
async def cmd_filter(
    interaction: discord.Interaction,
    type: str
):

    state = get_state(
        interaction.guild_id
    )

    state.filter_key = type

    vc = interaction.guild.voice_client

    if vc and state.current_song:

        state.queue.insert(
            0,
            state.current_song
        )

        vc.stop()

    await interaction.response.send_message(
        f"🎛️ Filter set to: **{type}**"
    )


# ============================================================
# /loop
# ============================================================

@bot.tree.command(
    name="loop",
    description="Toggle loop mode"
)
@app_commands.choices(
    mode=[
        app_commands.Choice(
            name="Off",
            value=0
        ),

        app_commands.Choice(
            name="Track",
            value=1
        ),

        app_commands.Choice(
            name="Queue",
            value=2
        ),
    ]
)
async def cmd_loop(
    interaction: discord.Interaction,
    mode: int
):

    state = get_state(
        interaction.guild_id
    )

    state.loop_mode = mode

    names = {
        0: "OFF",
        1: "TRACK",
        2: "QUEUE"
    }

    await interaction.response.send_message(
        f"🔁 Loop mode set to: "
        f"**{names[mode]}**"
    )


# ============================================================
# ERROR HANDLER
# ============================================================

@bot.tree.error
async def on_app_command_error(
    interaction: discord.Interaction,
    error: app_commands.AppCommandError
):

    logging.error(
        f"Command error: {error}"
    )

    try:

        if interaction.response.is_done():

            await interaction.followup.send(
                "❌ An error occurred.",
                ephemeral=True
            )

        else:

            await interaction.response.send_message(
                "❌ An error occurred.",
                ephemeral=True
            )

    except Exception:

        pass


# ============================================================
# START BOT
# ============================================================

if __name__ == "__main__":

    logging.info(
        "Starting Discord music bot..."
    )

    bot.run(TOKEN)