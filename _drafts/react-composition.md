---
layout: post
title:  "Stuff made out of things: Composing Components"
subtitle: "Relentless Progress toward goals isn't always what you need"
date: 2018-02-21
categories: showdev, react, javascript, components
---

So. You're sitting there. You have a thing. But now you wish it did a slightly different thing. But you don't want to have to make the thing all over again. 

Still with me?

Over the last week or so I've been working on a [visual novel player and editor using React][reactvn].

<p style="text-align:center">
<img src='/assets/2018/02/react-vn-1.png'><br/>
<em>it's super ugly right now</em>
</p>

This webapp is displaying a visual novel / choose-your-own-adventure story as a series of Nodes, with links to other Nodes (I even called them NodeLinks).

<p style="text-align:center">
<img src='/assets/2018/02/react-vn-ll.jpg'><br/>
<em>kinda like a LinkedList! (pardon the Post-it diagram)</em>
</p>

When you click on a NodeLink, it advances to the next page, like so:

**NodeLink.js**

```javascript
class NodeLink extends Component {
  nodeLinkClicked() {
    // remember to .bind(this) in the constructor!
    this.props.nodeLinkClicked && this.props.nodeLinkClicked(this.props.nodeLink)
  }

  render() {
    return (
      <button onClick={this.nodeLinkClicked}>
        {this.props.nodeLink.content}
      </button>
    )
  }
}
```

**Story.js**

```javascript
class Story extends Component {
  goToNode(nodeLink) {
    // again, remembder to .bind(this) as well!
    this.setState({
      ...this.state,
      currentNode:this.props.storyData.nodes[nodeLink.node]
    })
  }

  render() {
    return (
      <div className="node">
        <div className="node-content">{this.state.currentNode.content}</div>
        <div className="node-links">
          {this.state.currentNode.next.map(n => <NodeLink nodeLinkClicked={this.goToNode} nodeLink={n} key={btoa(`${n.content}-${n.node}`)} />)}
        </div>
      </div>
    )
  }
}
```

Seems simple! But what if a `NodeLink` could do&hellip;_more_&hellip;

## InputNodeLink

Commonly in these games, we want a response from the player. Whether it's their name or what they think about a character or their favorite food.

<p style="text-align:center">
<img src='/assets/2018/02/pizza.jpg'><br/>
<em>just wanted to show off my mediocre, though homemade, pizza</em>
<p>

I ended up thinking of this as a multistep process. First you click on a button, then you are prompted for input, then when the input is completed, the data is saved and you follow the NodeLink as usual.

<div style="text-align:center">
<div style='position:relative;padding-bottom:54%'>
  <iframe src='https://gfycat.com/ifr/IllegalFirmCob' frameborder='0' scrolling='no' width='100%' height='100%' style='position:absolute;top:0;left:0'></iframe>
</div>
<em>here's how it looks! severely unstyled, but it works!</em>
</div>

<div markdown="1">

So we clearly are using all of the NodeLink functionality, we just need to tack on some extra prompting functionality on top! The tiny OOP voice in my brain started screaming:

_I N H E R I T A N C E_

```javascript
class InputNodeLink extends NodeLink {
  // new functionality here
}
```

[But that isn't the React&trade; way.][reactcomp] It tightly couples your component to another, leaving the "source of truth" for state up in the air. Composition is a clearer way of doing this.

In this case, our InputNodeLink will be composted of a NodeLink, as well as a small prompt dialog (with an `<input type="text">` and a `<button>` to submit).

```javascript
class InputNodeLink extends Component {
  updateInput(e) {
    this.setState({
      ...this.state,
      inputValue:e.target.value
    });
  }
  render() {
    return (
      <Fragment>
        <NodeLink nodeLinkClicked={this.nodeLinkClicked} nodeLink={this.props.nodeLink} />
        { this.state.showInput && (
          <div className="input-area">
            <span className="prompt">{this.props.nodeLink.prompt}</span>
            <input type="text" onChange={this.updateInput} />
            <button onClick={this.onInputComplete}>Submit</button>
          </div>
        )}
      </Fragment>
    )
  }
}
```
_We also get to use React 16's new `<Fragment>` component to return what is actually two separate elements_

So, when we pass the same props to InputNodeLink, we can build out a NodeLink with extra functionality. We are passing `this.props.nodeLink` on to the internal `NodeLink` component, and we've also taken `InputNodeLink.nodeLinkClicked` and have it acting as a go-between for the `NodeLink` and the `Story`

**InputNodeLink.nodeLinkClicked**

```javascript
nodeLinkClicked() {
  this.setState({
    ...this.state,
    showInput:true
  })
}
```

This will show the input form. And when the button is clicked, it fires `onInputComplete`:

**InputNodeLink.onInputComplete**

```javascript
onInputComplete(e) {
  const inputValue = this.state.inputValue
  this.setState({
    ...this.state,
    showInput:false
  }, () => this.props.nodeLinkClicked && this.props.nodeLinkClicked({...this.props.nodeLink, inputValue}))
}
```

Which takes the input value in the state (updated in the input `onChange` event), and mashes it into the `nodeLink` argument in `nodeLinkClicked` (using the `...` spread operator).

At this point, `Story` can read the input value and save it!

**Story.js**
```javascript
goToNode(nodeLink) {
  // nodeLink.inputValue has the new input value from InputNodeLink!
  this.setState({
    ...this.state,
    currentNode:this.props.storyData.nodes[nodeLink.node]
    inputNodeData:nodeLink.inputValue
  });
}
```
_In real life, `inputNodeData` is an object that can handle an arbitrary amount of data, but for simplicity's sake, it only stores a single variable here_

There we go! We are able to extend our `NodeLink` component with relative ease, and slot our `InputNodeLink` in perfectly and with out (too much) pain.

_Check out the full project at [Github!][reactvn]_

## PS: render props!

Guess what, composition isn't even the only way to get this done! "Render props" (or "Children as a function") are an increasingly popular way of sharing code and functionality between components, where a base component allows for whatever is needed to be rendered inside of it. The child (which is a stateless component function) has access to the state of the base, and can do whatever it needs without the base component making assumptions.

There are a number of people who have waxed poetic on the advantages of render props. [Here's one!][mjrenderprops] And [another!][breakingup]

I'm still working on getting up to snuff on this new React pattern, so check back soon for an update to this on how to incorporate this into the choose your adventure app.

</div>

[reactvn]: https://github.com/washingtonsteven/react-vn
[reactcomp]: https://reactjs.org/docs/composition-vs-inheritance.html
[mjrenderprops]: https://cdb.reacttraining.com/use-a-render-prop-50de598f11ce
[breakingup]: https://medium.com/tandemly/im-breaking-up-with-higher-order-components-44b0df2db052