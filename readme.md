
### Build 

npm install
npm run build

then simply in root use some server, such as 
http-server 

### Release 

- Debug - simply change 'mode' in 'webpack.config.js' to 'none' and run 'npm run build'
- Production - simply change 'mode' in 'webpack.config.js' to 'production' and run 'npm run build' 

### Variables 

Through the project, private variables will be named such as 
m_{variable}
o_{variable}
s_{variable}

public 
{variable}

and the have different meaning. 

- m_{variable} : to be used for members, usually private fields that are exposed through getters and setters. Best rule is to use them for whatever is not o_{variable}, s_{variable} or {variable}.

- o_variable : this are optimization variables. In JS in render loop, it's not really good to create and allocate variable, therefore create one as member of class and change it's value. For example if val is of type Mat4, Vec2, Color, Rect etc... If they need to be created many times in render loop, avoid that and declare them as o_{variable} of a class, and change component value. o_color.r = 5 instead of new Color(5,0,0) !!!

- s_variable : usually state variable, which are not considered as members. For example we need to keep state of mouse left click, but click is irrelevant outside of class, then use s_leftClick. It can be user for statis as well

- {variable} : variables that are safe to be used as public ones, without getters or setters. Done for optimization, as getters and setter are overhead.

### Documentation

We use https://typedoc.org/

generate documentation with 

```npx typedoc src/index.ts```