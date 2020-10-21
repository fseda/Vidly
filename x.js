// DB relationships

// Trade off between query performance vs consistency

// Using References (Normalization) -> CONSISTENCY
let author = {
    name: 'Mosh'
}

let course = {
    author: 'id', 
    // author: [
    //     'id1', 
    //     'id1'
    // ]
}

// Using Embedded Documents (Denormalization) -> PERFORMANCE
let course = {
    author: {
        name: 'Mosh'
    }
}

// Using Hybrid approach
let author = {
    name: 'Mosh'
    // 50 other properties
}

let course = {
    author: {
        id: 'ref',
        name: 'Mosh'
    }
}

