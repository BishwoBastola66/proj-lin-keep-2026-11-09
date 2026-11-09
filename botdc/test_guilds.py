import asyncio
from bot import bot

@bot.event
async def on_ready():
    print("GUILDS:", bot.guilds)
    import sys; sys.exit(0)

bot.run("MTUzNTI0MzE3Nzc4OTg4MjM4OA.GCH5Uu.ccgzGVnDfLIZTOtdalF2ERXck-aJkUrAyUJ6Ok")
