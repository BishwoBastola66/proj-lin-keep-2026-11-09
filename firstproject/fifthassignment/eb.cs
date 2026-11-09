using System;

class ElectricityBill
{
    public static void Run()
    {
        string customerName;
        double previousReading, currentReading, consumption;

        Console.Write("Name: ");
        customerName = Console.ReadLine();

        Console.Write("Previous Meter Reading: ");
        previousReading = Convert.ToDouble(Console.ReadLine());

        Console.Write("Current Meter Reading: ");
        currentReading = Convert.ToDouble(Console.ReadLine());

        if (currentReading < previousReading)
        {
            Console.WriteLine("Invalid");
        }
        else
        {
            consumption = currentReading - previousReading;

            Console.WriteLine("Name: " + customerName);
            Console.WriteLine("Consumption: " + consumption + " Units");

            if (consumption > 100)
            {
                Console.WriteLine("High");
            }
            else
            {
                Console.WriteLine("Normal");
            }
        }
    }
}