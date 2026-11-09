using System;

class StudentNames
{
    public static void Run()
    {
        string[] names = { "Ram", "Shyam", "Hari", "Sita", "Gita" };

        int count = 0;

        Console.WriteLine("Students:");

        foreach (string name in names)
        {
            Console.WriteLine(name);
            count++;
        }

        Console.WriteLine("Total Students: " + count);
    }
}