#include <stdio.h>
#include <math.h>
int main(){ double a,b; char op;
  printf("C Calc — formato: a op b (ex: 2 + 3). Operadores: + - * / ^\n");
  while(scanf("%lf %c %lf", &a, &op, &b)==3){
    double r=0;
    switch(op){ case '+': r=a+b; break; case '-': r=a-b; break; case '*': r=a*b; break; case '/': r=a/b; break; case '^': r=pow(a,b); break; default: puts("op inválido"); continue; }
    printf("= %.10g\n", r);
  } return 0;
}