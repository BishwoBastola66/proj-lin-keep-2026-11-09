using System;

class Program
{
    static void Main()
    {

        //qn1
        int a = 20, b = 6;


        Console.WriteLine(a + b); //ans 26
        Console.WriteLine(a - b); //ans 14
        Console.WriteLine(a * b); //ans 120
        Console.WriteLine(a / b); //ans 3
        Console.WriteLine(a % b); //ans 2


        //qn3 
        int number = 10;

        number += 5;
        Console.WriteLine(number); // ans 15

        number -= 3;
        Console.WriteLine(number); // ans 12

        number *= 2;
        Console.WriteLine(number); // ans 24

        number /= 4;
        Console.WriteLine(number); // ans 6

        number %= 3;
        Console.WriteLine(number); // ans 0

        //qn4

        int math = 80, science = 75, computer = 90;
        const int ts = 3;

        int totl = math + science + computer;
        Console.WriteLine(totl); // ans 245

        double avg = (double)totl / ts;
        Console.WriteLine(avg); // ans 81.6667

        totl += 10;
        Console.WriteLine(totl); // ans 255

        //qn2
        int length = 10, width = 5;
        const int UNIT = 1;

        Console.WriteLine(length); // ans 10
        Console.WriteLine(width);  // ans 5
        Console.WriteLine(length * width * UNIT); // ans 50

    }
}
