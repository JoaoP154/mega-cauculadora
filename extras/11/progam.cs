using System;
class Program{
  static void Main(){
    Console.WriteLine("C# Calc — a op b (ex: 2 + 3). + - * / ^");
    string line;
    while((line = Console.ReadLine()) != null){
      var parts = line.Split(' ');
      if(parts.Length!=3) { Console.WriteLine("formato: a op b"); continue; }
      double a = double.Parse(parts[0]); string op = parts[1]; double b = double.Parse(parts[2]);
      double r = op switch { "+"=>a+b, "-"=>a-b, "*" => a*b, "/" => a/b, "^" => Math.Pow(a,b), _ => double.NaN };
      Console.WriteLine(double.IsNaN(r) ? "op inválido" : $"= {r}");
    }
  }
}
