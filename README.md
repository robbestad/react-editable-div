# Editable DIV

[React][1] Component that enables editable divs. 

Source on [github][3]

## Installation

    % npm install react-editable-div --save

## Usage

Optionally send in 'editable' as true/false in cause you want
to only want to set editable for certain users.

In the 'onChange' function, set up any method
you want to store the new value.

#### Example

    var Editable = require('react-editable-div');
    MyComponent = React.createClass({
      onChange: function (e) {
          // Use either
          //console.log(e.target.value);
          // or:
          //console.log(this.refs.editable.getDOMNode().innerHTML);
      },

      render: function() {
         return (
            <Editable editable={this.state.editable}
                           html="<b>H</b>el<b>lo </b><i><b>W</b>or<b>l</b>d<b>!</b></i>"
                           ref="editable" onChange={this.onChange} />
        );
      }
    });

[1]: https://facebook.github.io/react
[2]: https://github.com/svenanders/react-editable-div/issues/1
[3]: https://github.com/svenanders/react-editable-div
