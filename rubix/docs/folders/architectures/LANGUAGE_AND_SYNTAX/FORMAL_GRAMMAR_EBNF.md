# Rubix Formal Grammar Specification (ISO/IEC 14977 EBNF)

> **Status**: Canonical Accepted  
> **Classification**: Language Formal Grammar  
> **Subsystem**: Rubix Language & Syntax  
> **Last Updated**: October 2026  

---

## 1. Executive Summary

This document specifies the complete formal grammar of the Rubix programming language using standard **ISO/IEC 14977 Extended Backus-Naur Form (EBNF)**.

The grammar is designed to be unambiguous and parsable by single-pass predictive parsers with $LL(1)$ lookahead, supporting the ultra-fast streaming requirements of HNS and HNS-Hyperflux.

---

## 2. ISO/IEC 14977 EBNF Formal Grammar

```ebnf
(* =========================================================================
   Rubix Language Grammar Specification
   Conforming to ISO/IEC 14977 EBNF Standard
   ========================================================================= *)

(* --- 1. Top-Level Compilation Unit --- *)
CompilationUnit
    = { ModuleAttribute } , [ ModuleDeclaration ] , { ImportDeclaration } , { TopLevelItem } ;

ModuleDeclaration
    = "module" , QualifiedIdentifier , [ HologramAnnotation ] , ";" ;

HologramAnnotation
    = "@hologram" , "(" , "version" , "=" , VersionLiteral , [ "," , "contract" , "=" , StringLiteral ] , ")" ;

ImportDeclaration
    = "import" , QualifiedIdentifier , [ "as" , Identifier ] , [ ImportList ] , ";" ;

ImportList
    = "::" , "{" , Identifier , { "," , Identifier } , "}" ;

TopLevelItem
    = FunctionDeclaration
    | TypeDeclaration
    | InterfaceDeclaration
    | CapabilityDeclaration
    | GlobalConstant ;

(* --- 2. Tri-Stratum Type Declarations --- *)
TypeDeclaration
    = ValueTypeDeclaration
    | ResourceTypeDeclaration
    | CapabilityTypeDeclaration
    | CRDTTypeDeclaration
    | PersistentTypeDeclaration ;

ValueTypeDeclaration
    = "value" , "struct" , Identifier , [ GenericParameters ] , "{" , { FieldDeclaration } , "}" ;

ResourceTypeDeclaration
    = "resource" , "struct" , Identifier , [ GenericParameters ] , "{" , { FieldDeclaration } , "}" ;

CapabilityTypeDeclaration
    = "capability" , Identifier , [ "extends" , QualifiedIdentifier ] , "{" , { CapabilityPermission } , "}" ;

PersistentTypeDeclaration
    = "persistent" , "struct" , Identifier , [ GenericParameters ] , "{" , { FieldDeclaration } , "}" ;

CRDTTypeDeclaration
    = "crdt" , ( "register" | "set" | "counter" | "map" ) , Identifier , [ GenericParameters ] , "{" , { FieldDeclaration } , "}" ;

FieldDeclaration
    = [ VisibilityModifier ] , Identifier , ":" , TypeAnnotation , ";" ;

TypeAnnotation
    = PrimitiveType
    | UserDefinedType
    | AffineType
    | RegionBoundedType
    | CapabilityBoundedType ;

PrimitiveType
    = "u8" | "u16" | "u32" | "u64" | "u128" | "usize"
    | "i8" | "i16" | "i32" | "i64" | "i128" | "isize"
    | "f32" | "f64" | "bool" | "char" | "void" ;

UserDefinedType
    = QualifiedIdentifier , [ GenericArguments ] ;

AffineType
    = ( "own" | "borrow" | "mut" ) , TypeAnnotation ;

RegionBoundedType
    = "&" , "'" , Identifier , TypeAnnotation ;

CapabilityBoundedType
    = "cap" , [ "(" , Expression , ".." , Expression , ")" ] , TypeAnnotation ;

(* --- 3. Functions & Differentiable Stencils --- *)
FunctionDeclaration
    = [ "diff" ] , [ "pure" ] , "fn" , Identifier , [ GenericParameters ] ,
      "(" , [ ParameterList ] , ")" , [ "->" , TypeAnnotation ] ,
      [ EffectSpecification ] , BlockStatement ;

ParameterList
    = Parameter , { "," , Parameter } ;

Parameter
    = [ "own" | "borrow" | "mut" ] , Identifier , ":" , TypeAnnotation ;

EffectSpecification
    = "with" , "[" , EffectIdentifier , { "," , EffectIdentifier } , "]" ;

EffectIdentifier
    = "IO" | "Net" | "Alloc" | "Mut" | "Syscall" | "Time" | "Rand" ;

(* --- 4. Statements & Control Flow --- *)
Statement
    = VariableDeclarationStatement
    | AssignmentStatement
    | ExpressionStatement
    | IfStatement
    | MatchStatement
    | LoopStatement
    | RegionStatement
    | ReturnStatement ;

BlockStatement
    = "{" , { Statement } , "}" ;

VariableDeclarationStatement
    = "let" , [ "mut" ] , Identifier , [ ":" , TypeAnnotation ] , "=" , Expression , ";" ;

RegionStatement
    = "region" , "'" , Identifier , [ "(" , Expression , ")" ] , BlockStatement ;

IfStatement
    = "if" , Expression , BlockStatement , [ "else" , ( IfStatement | BlockStatement ) ] ;

MatchStatement
    = "match" , Expression , "{" , { MatchArm } , "}" ;

MatchArm
    = Pattern , "=>" , ( Expression , ";" | BlockStatement ) ;

LoopStatement
    = "loop" , BlockStatement
    | "while" , Expression , BlockStatement ;

ReturnStatement
    = "return" , [ Expression ] , ";" ;

(* --- 5. Expressions & Operators --- *)
Expression
    = LogicalOrExpression ;

LogicalOrExpression
    = LogicalAndExpression , { "||" , LogicalAndExpression } ;

LogicalAndExpression
    = EqualityExpression , { "&&" , EqualityExpression } ;

EqualityExpression
    = RelationalExpression , { ( "==" | "!=" ) , RelationalExpression } ;

RelationalExpression
    = AdditiveExpression , { ( "<" | "<=" | ">" | ">=" ) , AdditiveExpression } ;

AdditiveExpression
    = MultiplicativeExpression , { ( "+" | "-" ) , MultiplicativeExpression } ;

MultiplicativeExpression
    = UnaryExpression , { ( "*" | "/" | "%" ) , UnaryExpression } ;

UnaryExpression
    = ( "-" | "!" | "*" | "&" | "own" | "mut" ) , UnaryExpression
    | PrimaryExpression ;

PrimaryExpression
    = Literal
    | Identifier
    | FunctionCall
    | FieldAccess
    | BlockStatement
    | "(" , Expression , ")" ;

FunctionCall
    = PrimaryExpression , "(" , [ ArgumentList ] , ")" ;

FieldAccess
    = PrimaryExpression , "." , Identifier ;

ArgumentList
    = Expression , { "," , Expression } ;

(* --- 6. Lexical Tokens & Literals --- *)
Identifier
    = Letter , { Letter | Digit | "_" } ;

QualifiedIdentifier
    = Identifier , { "::" , Identifier } ;

Literal
    = IntegerLiteral | FloatLiteral | StringLiteral | BooleanLiteral ;

IntegerLiteral
    = [ "-" ] , Digit , { Digit } ;

FloatLiteral
    = [ "-" ] , Digit , { Digit } , "." , Digit , { Digit } ;

StringLiteral
    = '"' , { Character - '"' } , '"' ;

BooleanLiteral
    = "true" | "false" ;

Letter
    = "A" | ... | "Z" | "a" | ... | "z" | "_" ;

Digit
    = "0" | ... | "9" ;
```
