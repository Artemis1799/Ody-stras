using System;
using System.ComponentModel.DataAnnotations;
using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace t5_back.Models
{
    public class Photo
    {
        [Key]
        public Guid UUID { get; set; }
        
        public byte[] Picture { get; set; }
        
        [MaxLength(255)]
        public string Picture_name { get; set; }
        
		[JsonIgnore]
        public ICollection<Image_Point>? ImagePoints { get; set; }
    }
}