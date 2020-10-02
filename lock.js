
class Lock{
  constructor(name=''){
    this.name = name;
    this.lock = false;
    this.nlocks = 0;
  };

  wait(){
    var i = this.nlocks + 1;
    this.nlocks = i;
    while (true){
      if (!this.lock){ // Has somebody released the lock?
        if (i == 1){ // Is the first in line?
          this.nlocks--;
          break;
        } else {
          i--;
        };
      };
      sleep(1);
    };
  };

  acquire(){
    this.wait();
    this.lock = true;
  };

  release(){
    if (!this.lock){
      console.log('ERROR: ' + name + ' LOCK ALREADY RELEASED!');
    };
    this.lock = false;
  };
};
