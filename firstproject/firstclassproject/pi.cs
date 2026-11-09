using System;

class PersonalInformation
{
    public static void Run()
    {
        string name, address;
        int age;

        Console.Write("your name: ");
        name = Console.ReadLine() ?? "";

        Console.Write("Enter your age: ");
        age = Convert.ToInt32(Console.ReadLine());

        Console.Write("Enter your address: ");
        address = Console.ReadLine() ?? "";
        Console.WriteLine("nme: " + name);
        Console.WriteLine("ae: " + age);
        Console.WriteLine("adress: " + address);
    }
}