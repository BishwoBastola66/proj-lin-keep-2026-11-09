using System;

class ErrorCorrection
{
    public static void Run()
    {
        int a = 10;
        int b = 5;

        for (int i = 1; i <= 5; i++)
        {
            int result = a + b;

            if (i == 3)
            {
                continue;
            }

            Console.WriteLine(result);
        }
    }
}