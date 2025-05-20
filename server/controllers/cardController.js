module.exports = {
    index: (req, res) => {
      Rover.find({})
      .populate("rover")
      .then(rover => {
        res.json(rover);
      });
    },
    // Shows a  record based off of the title
    show:(req,res) => {
        Rover.find({roverName: req.params.roverName}).then(rover => {
            res.json(rover)
        })
    },
    // Create a new Rover record using the root of the website (using Post method)
    create:(req,res) => {
        const newRover = req.body
        Rover.create(newRover).then(rover => res.json(rover));
        
    }, 
    //Update an existing Job record referncing the title
    update:(req,res) => {
        const updatedRover = req.body

        Rover.findOneAndUpdate({_id: req.params._id}, updatedRover, {
            new: true
        })
        .then(rover => res.json(rover))
    },
    //Delete a rover record referencing the title 
    delete: (req,res) => {
        
        Rover.findByIdAndDelete( req.params._id)

      
        .then(deleteRover => {res.json(deleteRover)})
        .catch(err => console.log(err))
        
    }

  };
