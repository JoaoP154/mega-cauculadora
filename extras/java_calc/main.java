package java_calc;
import java.util.Scanner;
public class Main {
  public static void main(String[] args){
    Scanner sc = new Scanner(System.in);
    System.out.println("Java Calc — a op b (ex: 2 + 3). + - * / ^");
    while(sc.hasNextDouble()){
      double a = sc.nextDouble(); String op = sc.next(); double b = sc.nextDouble();
      double r=0;
      switch(op){
        case "+": r=a+b; break; case "-": r=a-b; break; case "*": r=a*b; break; case "/": r=a/b; break; case "^": r=Math.pow(a,b); break;
        default: System.out.println("op inválido"); continue;
      }
      System.out.println("= "+r);
    }
  }
}