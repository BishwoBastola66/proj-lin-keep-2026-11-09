using System;

class ForLoopContinueBreak
{
    public static void Run()
    {
        for (int i = 1; i <= 20; i++)
        {
            if (i == 15)
            {
                break;
            }

            if (i % 3 == 0)
            {
                continue;
            }

            Console.WriteLine(i);
        }
    }
}