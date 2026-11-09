import asyncio
from bot import bot

async def main():
    print(bot.tree.get_commands())

if __name__ == "__main__":
    asyncio.run(main())
