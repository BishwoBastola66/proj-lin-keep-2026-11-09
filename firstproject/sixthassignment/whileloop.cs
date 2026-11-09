using System;

class WhileLoopBreak
{
    public static void Run()
    {
        int number = 10;

        while (number >= 1)
        {
            if (number == 5)
            {
                break;
            }

            Console.WriteLine(number);
            number--;
        }

        Console.WriteLine("Loop Terminated");
    }
}